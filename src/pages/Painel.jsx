import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CirclePlus, ClipboardCheck, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import { useApp, ehAtivo, emValidacao, porPrioridade, visivelNaFila } from '../store.jsx';
import { MapaEventos } from '../components/Mapa.jsx';
import {
  ICONE_NIVEL, ICONE_TIPO, NivelBadge, ConfiancaBadge, FontesResumo, PrioridadeTag, TipoIcone, Vazio, tempoRelativo,
} from '../components/ui.jsx';
import { NIVEIS, ROTULO_NIVEL, TIPOS, RAIO_INTERESSE_KM, distanciaKm } from '../domain/regras.js';
import { ultimoDado } from '../domain/fontes.js';

// Tela 2: Painel de acompanhamento (RF07).
export default function Painel() {
  const { eventos, usuario, perfil, equipe, agora } = useApp();
  const [tipo, setTipo] = useState('todos');
  const [nivel, setNivel] = useState('todos');
  const [verFila, setVerFila] = useState(true);

  const ativos = useMemo(() => eventos.filter(ehAtivo), [eventos]);
  const fila = useMemo(
    () => (equipe ? eventos.filter((e) => emValidacao(e) && visivelNaFila(e, perfil)) : []),
    [eventos, equipe, perfil],
  );
  const filtrar = (lista) =>
    lista.filter((e) => (tipo === 'todos' || e.tipo === tipo) && (nivel === 'todos' || e.risco.nivel === nivel));

  const noMapa = useMemo(
    () => filtrar(verFila ? [...ativos, ...fila] : ativos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ativos, fila, verFila, tipo, nivel],
  );
  const prioridades = useMemo(
    () => filtrar(ativos).sort(porPrioridade).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ativos, tipo, nivel],
  );
  const locais = equipe ? [] : usuario.locais;
  const perto = ativos.filter((e) => locais.some((l) => distanciaKm(l, e) <= RAIO_INTERESSE_KM));
  const contagem = (n) => ativos.filter((e) => e.risco.nivel === n).length;

  return (
    <>
      <p className="page-intro">
        Olá, {usuario.nome.split(' ')[0]}. {ativos.length} eventos ativos agora
        {equipe ? ` e ${fila.length} aguardando validação.` : `, ${perto.length} a até ${RAIO_INTERESSE_KM} km dos seus locais.`}
      </p>

      <div className="kpis">
        {[...NIVEIS].reverse().map((n) => {
          const Icone = ICONE_NIVEL[n];
          return (
            <button
              key={n}
              type="button"
              className={`kpi kpi-${n}`}
              style={{ textAlign: 'left', cursor: 'pointer', outlineOffset: 2, background: nivel === n ? 'var(--surface-2)' : undefined }}
              aria-pressed={nivel === n}
              onClick={() => setNivel(nivel === n ? 'todos' : n)}
              title={`Filtrar o painel por risco ${ROTULO_NIVEL[n]}`}
            >
              <span className="n">{contagem(n)}</span>
              <span className="l"><Icone size={15} aria-hidden="true" /> Risco {ROTULO_NIVEL[n]}</span>
            </button>
          );
        })}
        {equipe ? (
          <Link to="/validacao" className="kpi kpi-fila">
            <span className="n">{fila.length}</span>
            <span className="l"><ClipboardCheck size={15} aria-hidden="true" /> Aguardando validação</span>
          </Link>
        ) : (
          <div className="kpi kpi-fila">
            <span className="n">{perto.length}</span>
            <span className="l"><MapPin size={15} aria-hidden="true" /> Perto de você</span>
          </div>
        )}
      </div>

      <div className="grid-2">
        <section className="card card-flush">
          <div className="card-head">
            <h2>Mapa de eventos</h2>
            {equipe ? (
              <label className="row small">
                <input type="checkbox" checked={verFila} onChange={(e) => setVerFila(e.target.checked)} />
                Mostrar eventos em validação
              </label>
            ) : null}
          </div>
          <div className="pills" style={{ padding: '0 18px 12px' }} role="group" aria-label="Filtrar por tipo de risco">
            <button type="button" className="pill" aria-pressed={tipo === 'todos'} onClick={() => setTipo('todos')}>
              Todos
            </button>
            {Object.entries(TIPOS).map(([chave, t]) => {
              const Icone = ICONE_TIPO[chave];
              return (
                <button key={chave} type="button" className="pill" aria-pressed={tipo === chave} onClick={() => setTipo(chave)}>
                  <Icone size={14} aria-hidden="true" /> {t.rotulo}
                </button>
              );
            })}
          </div>
          <MapaEventos eventos={noMapa} locais={locais} />
          <div className="legend">
            <span><i style={{ background: 'var(--critico-solid)' }} /> Crítico</span>
            <span><i style={{ background: 'var(--alto-solid)' }} /> Alto</span>
            <span><i style={{ background: 'var(--moderado-solid)' }} /> Moderado</span>
            <span><i style={{ background: 'var(--baixo-solid)' }} /> Baixo</span>
            {equipe ? <span><i style={{ background: '#64748b' }} /> Em validação</span> : null}
            {!equipe ? <span><i style={{ background: 'var(--nav)' }} /> Seus locais, com raio de {RAIO_INTERESSE_KM} km</span> : null}
          </div>
        </section>

        <div className="stack">
          <section className="card card-flush">
            <div className="card-head">
              <h2>Prioridade agora</h2>
              <Link to="/alertas" className="small strong">Ver todos</Link>
            </div>
            {prioridades.length === 0 ? (
              <Vazio icone={ShieldCheck} titulo="Nenhum evento com esse filtro">
                Limpe os filtros para ver todos os eventos ativos.
              </Vazio>
            ) : (
              <div className="alert-list">
                {prioridades.map((e) => (
                  <Link key={e.id} to={`/alertas/${e.id}`} className="alert-row" style={{ alignItems: 'flex-start' }}>
                    <PrioridadeTag prioridade={e.prioridade} />
                    <div className="grow">
                      <div className="title">{e.titulo}</div>
                      <div className="meta">
                        <NivelBadge nivel={e.risco.nivel} />
                        <ConfiancaBadge confianca={e.confianca} />
                      </div>
                      <div className="meta">
                        <FontesResumo fontes={e.fontes} />
                        <span className="tiny muted">Atualizado {tempoRelativo(ultimoDado(e, agora), agora)}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="chev" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {equipe ? (
            <section className="card stack-sm">
              <h2>Fila de validação</h2>
              <p className="small muted">
                {fila.length
                  ? `${fila.length} eventos com confiança abaixo de 75 esperam a decisão de um agente.`
                  : 'Nenhum evento aguardando validação.'}
              </p>
              {fila.slice().sort(porPrioridade).slice(0, 3).map((e) => (
                <div key={e.id} className="row">
                  <PrioridadeTag prioridade={e.prioridade} />
                  <span className="grow small strong">{e.titulo}</span>
                  <span className="tiny muted nowrap">{tempoRelativo(e.criadoEm, agora)}</span>
                </div>
              ))}
              <Link to="/validacao" className="btn btn-primary btn-sm">
                <ClipboardCheck size={15} aria-hidden="true" /> Abrir fila de validação
              </Link>
            </section>
          ) : (
            <section className="card stack-sm">
              <div className="row">
                <TipoIcone tipo="alagamento" />
                <div>
                  <h2>Viu algo na sua rua?</h2>
                  <p className="small muted">Seu registro vira um dado da plataforma e ajuda a confirmar alertas.</p>
                </div>
              </div>
              <Link to="/registrar" className="btn btn-primary">
                <CirclePlus size={17} aria-hidden="true" /> Registrar ocorrência
              </Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
