import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, SearchX, CircleX } from 'lucide-react';
import { useApp, ehAtivo, emValidacao } from '../store.jsx';
import { MapaEventos } from '../components/Mapa.jsx';
import {
  CicloDeVida, ConfiancaBadge, FonteChip, Modal, NivelBadge, PrioridadeTag, StatusTag, TipoIcone, Vazio,
  dataHora, tempoRelativo,
} from '../components/ui.jsx';
import { ROTULO_CONFIANCA, ROTULO_EXPOSICAO, ROTULO_NIVEL, TIPOS, formatarValor } from '../domain/regras.js';
import { coletaDaFonte, ultimoDado } from '../domain/fontes.js';

// Tela 4: Detalhe do alerta (RF06 e RF09).
export default function AlertaDetalhe() {
  const { id } = useParams();
  const { eventos, equipe, agora, acoes } = useApp();
  const evento = eventos.find((e) => e.id === id);
  const [encerrando, setEncerrando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const noMapa = useMemo(() => (evento ? [evento] : []), [evento]);

  if (!evento) {
    return (
      <section className="card">
        <Vazio icone={SearchX} titulo="Alerta não encontrado">
          <Link to="/alertas">Voltar para a lista de alertas</Link>
        </Vazio>
      </section>
    );
  }

  const tipo = TIPOS[evento.tipo];
  const { risco, confianca } = evento;
  const valor = formatarValor(evento);

  const encerrar = () => {
    acoes.encerrar(evento.id, motivo.trim());
    acoes.avisar(`Evento ${evento.id} encerrado.`);
    setEncerrando(false);
    setMotivo('');
  };

  return (
    <>
      <Link to="/alertas" className="back"><ArrowLeft size={16} aria-hidden="true" /> Voltar para alertas</Link>

      <section className="card stack">
        <div className="detail-head">
          <TipoIcone tipo={evento.tipo} nivel={risco.nivel} size={26} />
          <div className="grow">
            <h2 style={{ fontSize: '1.3rem' }}>{evento.titulo}</h2>
            <p className="muted small">
              {tipo.rotulo} · {evento.bairro.nome} · {evento.id} · atualizado {tempoRelativo(ultimoDado(evento, agora), agora)}
            </p>
          </div>
          <div className="row-wrap">
            <NivelBadge nivel={risco.nivel} grande />
            <PrioridadeTag prioridade={evento.prioridade} />
            <StatusTag status={evento.status} />
          </div>
        </div>
        <CicloDeVida evento={evento} />
      </section>

      <div className="grid-2">
        <div className="stack">
          <section className="card stack">
            <h2>O que está acontecendo</h2>
            <p>{evento.descricao}</p>
            <div className="facts">
              <div className="fact">
                <div className="k">{tipo.medida}</div>
                <div className="v">{valor || tipo.intensidades[risco.severidade - 1]}</div>
              </div>
              <div className="fact">
                <div className="k">Severidade</div>
                <div className="v">{risco.severidade} de 4</div>
              </div>
              <div className="fact">
                <div className="k">Exposição da área</div>
                <div className="v">{risco.exposicao} de 3 · {ROTULO_EXPOSICAO[risco.exposicao]}</div>
              </div>
            </div>
            <p className="small muted">
              Risco = severidade {risco.severidade} × exposição {risco.exposicao} = {risco.produto}, nível{' '}
              {ROTULO_NIVEL[risco.nivel]}. Exposição: {evento.bairro.criterio.toLowerCase()}. Com confiança{' '}
              {ROTULO_CONFIANCA[confianca.classe]}, a prioridade é {evento.prioridade}.
            </p>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: 6 }}>O que fazer</h2>
            <ul className="guide">
              {tipo.orientacoes.map((o) => (
                <li key={o}><Check size={17} aria-hidden="true" /> <span>{o}</span></li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: 14 }}>Histórico do evento</h2>
            <ol className="timeline">
              {evento.historico.map((h, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={i}>
                  <span className="mark" aria-hidden="true" />
                  <div>
                    <div className="row-wrap">
                      <span className="strong">{h.status}</span>
                      <span className="when">{dataHora(h.em)} · {tempoRelativo(h.em, agora)}</span>
                    </div>
                    <div className="small" style={{ color: 'var(--ink-2)' }}>{h.nota}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="stack">
          <section className="card stack">
            <h2>Origem e confiança</h2>
            <div className="row-wrap">
              <ConfiancaBadge confianca={confianca} grande />
            </div>
            <ul className="stack-sm">
              {evento.fontes.map((f) => (
                <li key={f.chave} className="row" style={{ alignItems: 'flex-start' }}>
                  <FonteChip tipo={f.tipo} />
                  <span className="small grow">
                    {f.tipo === 'comunidade' ? 'Relato de morador' : f.nome}
                    <span className="muted"> · {tempoRelativo(coletaDaFonte(f, evento, agora), agora)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link to={`/alertas/${evento.id}/origem`} className="btn btn-primary">
              Ver origem e cálculo da confiança <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section className="card card-flush">
            <div className="card-head"><h2>Local</h2><span className="small muted">{evento.bairro.nome}</span></div>
            <MapaEventos eventos={noMapa} altura={240} />
          </section>

          {equipe && ehAtivo(evento) ? (
            <section className="card stack-sm">
              <h2>Ações da equipe</h2>
              <p className="small muted">Encerre o evento quando a situação voltar ao normal.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setEncerrando(true)}>
                <CircleX size={16} aria-hidden="true" /> Encerrar evento
              </button>
            </section>
          ) : null}
          {equipe && emValidacao(evento) ? (
            <section className="card stack-sm">
              <h2>Aguardando validação</h2>
              <p className="small muted">A confiança está abaixo de 75. O alerta só é emitido após a confirmação.</p>
              <Link to="/validacao" className="btn btn-primary">
                <ClipboardCheck size={16} aria-hidden="true" /> Ir para a fila de validação
              </Link>
            </section>
          ) : null}
        </div>
      </div>

      {encerrando ? (
        <Modal
          titulo={`Encerrar ${evento.id}`}
          aoFechar={() => setEncerrando(false)}
          rodape={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setEncerrando(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" disabled={motivo.trim().length < 5} onClick={encerrar}>
                Encerrar evento
              </button>
            </>
          )}
        >
          <p>{evento.titulo}. Os moradores avisados recebem a notificação de encerramento.</p>
          <div className="field">
            <label htmlFor="motivo">Justificativa</label>
            <textarea
              id="motivo"
              className="textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: nível do córrego voltou ao normal."
            />
            <span className="hint">Obrigatória. Fica registrada no histórico do evento.</span>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
