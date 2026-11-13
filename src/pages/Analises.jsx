import { useApp } from '../store.jsx';
import { duracao } from '../components/ui.jsx';
import { FONTES } from '../data/seed.js';
import { NIVEIS, ROTULO_FONTE, ROTULO_NIVEL, STATUS, TIPOS } from '../domain/regras.js';

function contar(lista, chave) {
  const mapa = new Map();
  lista.forEach((item) => {
    const k = chave(item);
    mapa.set(k, (mapa.get(k) || 0) + 1);
  });
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}

function Barras({ dados, classe }) {
  const maximo = Math.max(1, ...dados.map(([, n]) => n));
  return (
    <div className="bars">
      {dados.map(([rotulo, n, chave]) => (
        <div className="bar-row" key={rotulo}>
          <span>{rotulo}</span>
          <span className="track">
            <span className={`fill ${classe ? classe(chave) : ''}`} style={{ width: `${(n / maximo) * 100}%`, display: 'block' }} />
          </span>
          <span className="val">{n}</span>
        </div>
      ))}
    </div>
  );
}

const confirmou = (e) => e.historico.find((h) => h.status === STATUS.confirmado);

// Tela 11: Análises (RF16). Tudo é calculado a partir dos eventos da plataforma.
export default function Analises() {
  const { eventos } = useApp();

  const confirmados = eventos.filter(confirmou);
  const descartados = eventos.filter((e) => e.status === STATUS.descartado);
  const decididos = confirmados.length + descartados.length;
  const taxa = decididos ? Math.round((confirmados.length / decididos) * 100) : 0;
  const alertas = eventos.filter((e) => e.historico.some((h) => h.status === STATUS.alerta)).length;
  const tempos = confirmados.map((e) => confirmou(e).em - e.criadoEm);
  const tempoMedio = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;

  const porTipo = contar(eventos, (e) => TIPOS[e.tipo].rotulo);
  const porBairro = contar(eventos, (e) => e.bairro.nome).slice(0, 7);
  const porNivel = [...NIVEIS].reverse().map((n) => [ROTULO_NIVEL[n], eventos.filter((e) => e.risco.nivel === n).length, n]);

  const origens = ['publica', 'sensor', 'comunidade'].map((tipo) => {
    const doTipo = eventos.filter((e) => e.confianca.principal.tipo === tipo);
    const ok = doTipo.filter(confirmou).length;
    const fora = doTipo.filter((e) => e.status === STATUS.descartado).length;
    return { tipo, total: doTipo.length, ok, fora, taxa: ok + fora ? Math.round((ok / (ok + fora)) * 100) : null };
  });

  const atualizacao = ['sensor', 'publica'].map((tipo) => {
    const lista = FONTES.filter((f) => f.tipo === tipo);
    const ativas = lista.filter((f) => f.situacao === 'ativa').length;
    return { tipo, total: lista.length, ativas, meta: lista[0].intervaloSeg };
  });

  return (
    <>
      <p className="page-intro">
        Indicadores dos últimos 7 dias, calculados a partir dos {eventos.length} eventos registrados na demonstração.
      </p>

      <div className="grid-4">
        <div className="card stat">
          <span className="n">{eventos.length}</span>
          <span className="l">Eventos registrados</span>
          <span className="small muted">{alertas} geraram alerta</span>
        </div>
        <div className="card stat">
          <span className="n">{taxa}%</span>
          <span className="l">Taxa de confirmação</span>
          <span className="small muted">{confirmados.length} confirmados e {descartados.length} descartados</span>
        </div>
        <div className="card stat">
          <span className="n">{duracao(tempoMedio)}</span>
          <span className="l">Tempo médio até confirmar</span>
          <span className="small muted">do recebimento à confirmação</span>
        </div>
        <div className="card stat">
          <span className="n">{atualizacao[0].ativas + atualizacao[1].ativas} de {atualizacao[0].total + atualizacao[1].total}</span>
          <span className="l">Fontes dentro da meta</span>
          <span className="small muted">sensores a cada 60 s, bases a cada 10 min</span>
        </div>
      </div>

      <div className="grid-half">
        <section className="card stack">
          <h2>Eventos por tipo de risco</h2>
          <Barras dados={porTipo} />
        </section>
        <section className="card stack">
          <h2>Eventos por nível de risco</h2>
          <Barras dados={porNivel} classe={(n) => `nivel-${n}`} />
        </section>
        <section className="card stack">
          <h2>Bairros com mais eventos</h2>
          <Barras dados={porBairro} />
        </section>
        <section className="card card-flush">
          <div className="card-head" style={{ paddingBottom: 12, marginBottom: 0 }}>
            <h2>Qualidade por origem do dado</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Fonte principal</th><th className="num">Eventos</th><th className="num">Confirmados</th><th className="num">Descartados</th><th className="num">Taxa</th></tr>
              </thead>
              <tbody>
                {origens.map((o) => (
                  <tr key={o.tipo}>
                    <td className="strong">{ROTULO_FONTE[o.tipo]}</td>
                    <td className="num">{o.total}</td>
                    <td className="num">{o.ok}</td>
                    <td className="num">{o.fora}</td>
                    <td className="num strong">{o.taxa === null ? 'Sem decisão' : `${o.taxa}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card card-flush">
        <div className="card-head" style={{ paddingBottom: 12, marginBottom: 0 }}>
          <h2>Tempo de atualização por tipo de fonte</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Tipo de fonte</th><th className="num">Fontes</th><th className="num">Dentro da meta</th><th>Meta de atualização</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {atualizacao.map((a) => (
                <tr key={a.tipo}>
                  <td className="strong">{ROTULO_FONTE[a.tipo]}</td>
                  <td className="num">{a.total}</td>
                  <td className="num">{a.ativas}</td>
                  <td>{a.meta < 120 ? `a cada ${a.meta} s` : `a cada ${a.meta / 60} min`}</td>
                  <td>
                    {a.ativas === a.total
                      ? <span className="chip chip-ok">Todas dentro da meta</span>
                      : <span className="chip chip-warn">{a.total - a.ativas} fora da meta</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
