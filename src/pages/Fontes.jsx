import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Landmark, Play, Users } from 'lucide-react';
import { useApp } from '../store.jsx';
import { ultimaAtualizacao } from '../domain/fontes.js';
import { FonteChip, NivelBadge, tempoRelativo } from '../components/ui.jsx';
import { FONTES, bairroPorId, fontePorId } from '../data/seed.js';
import {
  BASE_CONFIANCA, ROTULO_EXPOSICAO, TIPOS, calcularRisco, faixaDeOperacao, foraDaFaixa, severidadePorValor,
} from '../domain/regras.js';

const SITUACAO = {
  ativa: ['chip-ok', 'Ativa'],
  atrasada: ['chip-warn', 'Atrasada'],
  fora: ['chip-bad', 'Fora do ar'],
};

const PREDEFINIDOS = {
  alagamento: [['Normal', 3], ['Severidade 2', 25], ['Severidade 3', 45], ['Severidade 4', 70], ['Fora da faixa', 420]],
  calor: [['Normal', 28], ['Severidade 2', 36], ['Severidade 3', 39], ['Severidade 4', 42], ['Fora da faixa', 70]],
};

const intervalo = (seg) => (!seg ? 'Sob demanda' : seg < 120 ? `${seg} s` : `${seg / 60} min`);

// Tela 10: Fontes de dados (RF01, RF02 e RF15).
export default function Fontes() {
  const { agora, eventos, acoes } = useApp();
  const [fonteId, setFonteId] = useState('S-NA-021');
  const [valor, setValor] = useState(45);
  const [resultado, setResultado] = useState(null);

  const sensores = FONTES.filter((f) => f.tipo === 'sensor');
  const publicas = FONTES.filter((f) => f.tipo === 'publica');
  const ativos = (lista) => lista.filter((f) => f.situacao === 'ativa').length;
  const relatos = eventos.flatMap((e) => e.fontes.filter((f) => f.tipo === 'comunidade'));
  const relatosDia = relatos.filter((f) => agora - f.coletadoEm < 24 * 3_600_000).length;
  const ultimoRelato = relatos.length ? Math.max(...relatos.map((f) => f.coletadoEm)) : null;

  const fonte = fontePorId(fonteId);
  const tipo = TIPOS[fonte.mede];
  const bairro = bairroPorId(fonte.bairroId);
  const numero = Number(valor);
  const severidade = severidadePorValor(fonte.mede, numero);
  const fora = foraDaFaixa(fonte.mede, numero);
  const previsto = severidade > 0 ? calcularRisco({ severidade, exposicao: bairro.exposicao }) : null;
  const [minimo, maximo] = faixaDeOperacao(fonte.mede);

  const trocarSensor = (id) => {
    setFonteId(id);
    setValor(PREDEFINIDOS[fontePorId(id).mede][2][1]);
    setResultado(null);
  };

  const enviar = (e) => {
    e.preventDefault();
    setResultado(acoes.simularLeitura(fonteId, numero));
  };

  return (
    <>
      <p className="page-intro">
        Situação de cada fonte que alimenta a plataforma. Meta de atualização: sensores a cada 60 s e bases públicas
        a cada 10 min.
      </p>

      <div className="grid-3">
        <div className="card stat">
          <span className="l row"><Cpu size={16} aria-hidden="true" /> Sensores</span>
          <span className="n">{ativos(sensores)} de {sensores.length}</span>
          <span className="small muted">ativos e dentro da meta</span>
        </div>
        <div className="card stat">
          <span className="l row"><Landmark size={16} aria-hidden="true" /> Bases públicas</span>
          <span className="n">{ativos(publicas)} de {publicas.length}</span>
          <span className="small muted">ativas e dentro da meta</span>
        </div>
        <div className="card stat">
          <span className="l row"><Users size={16} aria-hidden="true" /> Comunidade</span>
          <span className="n">{relatosDia}</span>
          <span className="small muted">registros nas últimas 24 h</span>
        </div>
      </div>

      <section className="card card-flush">
        <div className="card-head" style={{ paddingBottom: 12, marginBottom: 0 }}>
          <h2>Fontes cadastradas</h2>
          <span className="small muted">{FONTES.length} fontes</span>
        </div>
        <div className="table-wrap">
          <table className="table table-fontes">
            <thead>
              <tr>
                <th>Fonte</th><th>Tipo</th><th>O que informa</th><th>Situação</th><th>Última atualização</th>
                <th>Intervalo esperado</th><th className="num">Confiança base</th>
              </tr>
            </thead>
            <tbody>
              {FONTES.map((f) => {
                const [classe, rotulo] = SITUACAO[f.situacao];
                const ultima = f.tipo === 'comunidade' ? ultimoRelato : ultimaAtualizacao(f, agora);
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="strong">{f.nome}</div>
                      <div className="tiny muted">{f.id}{f.bairroId ? ` · ${bairroPorId(f.bairroId).nome}` : ''}</div>
                    </td>
                    <td><FonteChip tipo={f.tipo} /></td>
                    <td>{f.mede ? TIPOS[f.mede].rotulo : 'Todos os tipos'}</td>
                    <td><span className={`chip ${classe}`}>{rotulo}</span></td>
                    <td className="nowrap">{ultima ? tempoRelativo(ultima, agora) : 'Sem registros'}</td>
                    <td className="nowrap">{intervalo(f.intervaloSeg)}</td>
                    <td className="num">{BASE_CONFIANCA[f.tipo]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-half">
        <section className="card">
          <form className="stack" onSubmit={enviar}>
            <div>
              <h2>Simular leitura de sensor</h2>
              <p className="small muted">
                Envia uma leitura fictícia pelo mesmo fluxo de um dado real: ingestão, validação, classificação e
                notificação.
              </p>
            </div>
            <div className="field">
              <label htmlFor="sensor">Sensor</label>
              <select id="sensor" className="select" value={fonteId} onChange={(e) => trocarSensor(e.target.value)}>
                {sensores.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.situacao === 'fora'}>
                    {s.id} · {s.nome}{s.situacao !== 'ativa' ? ` (${SITUACAO[s.situacao][1].toLowerCase()})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="valor">{tipo.medida} ({tipo.unidade})</label>
              <input
                id="valor"
                className="input"
                type="number"
                step="1"
                value={valor}
                onChange={(e) => { setValor(e.target.value); setResultado(null); }}
                required
              />
              <div className="pills">
                {PREDEFINIDOS[fonte.mede].map(([rotulo, v]) => (
                  <button
                    key={rotulo}
                    type="button"
                    className="pill"
                    aria-pressed={numero === v}
                    onClick={() => { setValor(v); setResultado(null); }}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
              <span className="hint">Faixa de operação do sensor: {minimo} a {maximo} {tipo.unidade}.</span>
            </div>
            <div className="fact">
              <div className="k">Classificação prevista em {bairro.nome}</div>
              {previsto ? (
                <div className="row-wrap" style={{ marginTop: 6 }}>
                  <span className="small">
                    Severidade {severidade} × exposição {bairro.exposicao} ({ROTULO_EXPOSICAO[bairro.exposicao]}) = {previsto.produto}
                  </span>
                  <NivelBadge nivel={previsto.nivel} />
                  {fora ? <span className="chip chip-bad">Fora da faixa: confiança −30</span> : null}
                  {fonte.situacao === 'atrasada' ? <span className="chip chip-warn">Sensor atrasado: confiança −20</span> : null}
                </div>
              ) : (
                <div className="v small">Leitura dentro do normal: não gera evento.</div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={valor === '' || Number.isNaN(numero)}>
              <Play size={16} aria-hidden="true" /> Enviar leitura
            </button>
          </form>
        </section>

        <section className="card stack">
          <h2>Resultado do processamento</h2>
          {resultado ? (
            <>
              <ol className="pipeline">
                {resultado.passos.map((p, i) => (
                  <li key={p.etapa}>
                    <span className="n">{i + 1}</span>
                    <span><span className="strong">{p.etapa}.</span> {p.texto}</span>
                  </li>
                ))}
              </ol>
              {resultado.eventoId ? (
                <Link to={`/alertas/${resultado.eventoId}`} className="btn btn-primary">
                  Abrir {resultado.eventoId} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </>
          ) : (
            <p className="muted">
              Envie uma leitura para ver cada etapa. Uma leitura de sensor ativo tem confiança 80 e é confirmada
              sozinha. Um sensor atrasado ou fora da faixa cai para a fila de validação.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
