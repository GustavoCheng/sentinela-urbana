import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Clock, EyeOff, Info, SearchX, Star, TriangleAlert, UserRound } from 'lucide-react';
import { useApp } from '../store.jsx';
import { FonteChip, Medidor, Vazio, dataHora, tempoRelativo } from '../components/ui.jsx';
import {
  BASE_CONFIANCA, JANELA_AGRUPAMENTO_MIN, LIMITE_CONFIRMACAO_AUTOMATICA, ROTULO_CONFIANCA,
} from '../domain/regras.js';
import { coletaDaFonte } from '../domain/fontes.js';

const SIGNIFICADO = {
  alta: 'Dado de fonte oficial ou medido por sensor, ou confirmado por mais de uma fonte. O evento é confirmado automaticamente.',
  media: 'Dado plausível, mas que ainda depende de poucas fontes. Um agente precisa confirmar antes do alerta.',
  baixa: 'Dado de uma única fonte, sem evidência adicional. Um agente precisa confirmar antes do alerta.',
};

// RN10: o público nunca vê quem fez o relato.
function autor(fonte, equipe, usuario) {
  if (equipe) return fonte.autorNome;
  if (fonte.autorId === usuario.id) return 'Você';
  return 'Morador da região';
}

// Tela 5: Origem e confiança do dado (RF04, RF05 e RF10).
export default function OrigemConfianca() {
  const { id } = useParams();
  const { eventos, equipe, usuario, agora } = useApp();
  const evento = eventos.find((e) => e.id === id);

  if (!evento) {
    return (
      <section className="card">
        <Vazio icone={SearchX} titulo="Alerta não encontrado">
          <Link to="/alertas">Voltar para a lista de alertas</Link>
        </Vazio>
      </section>
    );
  }

  const { confianca } = evento;
  const fontes = [...evento.fontes].sort((a, b) => BASE_CONFIANCA[b.tipo] - BASE_CONFIANCA[a.tipo]);

  return (
    <>
      <Link to={`/alertas/${evento.id}`} className="back">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para {evento.titulo}
      </Link>
      <p className="page-intro">
        De onde veio cada dado do evento {evento.id} e como a confiança de {confianca.pontos} pontos foi calculada.
      </p>

      <div className="grid-half">
        <section className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <h2>Fontes deste evento</h2>
            <span className="chip">{fontes.length} {fontes.length === 1 ? 'fonte' : 'fontes'}</span>
          </div>
          {fontes.map((f) => {
            const principal = f.chave === confianca.principal.chave;
            return (
              <article key={f.chave} className={`source ${principal ? 'source-main' : ''}`}>
                <div className="row-wrap between">
                  <FonteChip tipo={f.tipo} />
                  {principal ? <span className="chip chip-ok"><Star size={12} aria-hidden="true" /> Fonte principal</span> : null}
                </div>
                <div>
                  <div className="strong">{f.tipo === 'comunidade' ? 'Relato pelo aplicativo' : f.nome}</div>
                  <div className="small muted">
                    {f.tipo === 'comunidade' ? (
                      <><UserRound size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {autor(f, equipe, usuario)}</>
                    ) : (
                      <>Identificação: {f.fonteId}</>
                    )}
                    {' · '}confiança base {BASE_CONFIANCA[f.tipo]}
                  </div>
                </div>
                <p>{f.detalhe}</p>
                <div className="row-wrap small muted">
                  <Clock size={14} aria-hidden="true" />
                  Coletado em {dataHora(coletaDaFonte(f, evento, agora))} ({tempoRelativo(coletaDaFonte(f, evento, agora), agora)})
                </div>
                <div className="row-wrap">
                  {f.foto ? <span className="chip chip-ok"><Camera size={12} aria-hidden="true" /> Com foto</span> : null}
                  {f.relatorConfiavel ? <span className="chip chip-ok"><Star size={12} aria-hidden="true" /> Relator com histórico confirmado</span> : null}
                  {f.atrasado ? <span className="chip chip-warn"><Clock size={12} aria-hidden="true" /> Dado atrasado</span> : null}
                  {f.foraDaFaixa ? <span className="chip chip-bad"><TriangleAlert size={12} aria-hidden="true" /> Leitura fora da faixa</span> : null}
                </div>
              </article>
            );
          })}
          {!equipe && fontes.some((f) => f.tipo === 'comunidade') ? (
            <div className="note">
              <EyeOff size={17} aria-hidden="true" />
              <span>Relatos de moradores aparecem sem nome nem contato. Só a equipe de validação vê quem enviou.</span>
            </div>
          ) : null}
          <p className="small muted">
            Dados do mesmo tipo recebidos a até 500 m e {JANELA_AGRUPAMENTO_MIN} min de distância são agrupados no mesmo evento.
          </p>
        </section>

        <div className="stack">
          <section className="card stack">
            <h2>Nível de confiança</h2>
            <div className="score">
              <span className="big">{confianca.pontos}</span>
              <span className="muted">de 100</span>
              <span className="badge conf badge-lg" style={{ marginLeft: 'auto' }}>
                <Medidor classe={confianca.classe} /> Confiança {ROTULO_CONFIANCA[confianca.classe]}
              </span>
            </div>
            <div>
              <div className="scale" role="img" aria-label={`Confiança ${confianca.pontos} de 100`}>
                <span /><span /><span />
                <i className="needle" style={{ left: `${confianca.pontos}%` }} />
              </div>
              <div className="scale-labels">
                <span>Baixa · 0 a 49</span><span>Média · 50 a 74</span><span>Alta · 75 a 100</span>
              </div>
            </div>
            <p className="small">{SIGNIFICADO[confianca.classe]}</p>
          </section>

          <section className="card stack">
            <h2>Como o valor foi calculado</h2>
            <table className="factors">
              <tbody>
                {confianca.fatores.map((f) => (
                  <tr key={f.rotulo}>
                    <td>{f.rotulo}</td>
                    <td className={f.base ? '' : f.pontos > 0 ? 'pos' : 'neg'}>
                      {f.base ? f.pontos : `${f.pontos > 0 ? '+' : '−'}${Math.abs(f.pontos)}`}
                    </td>
                  </tr>
                ))}
                <tr className="total">
                  <td>
                    Confiança do evento
                    {confianca.soma !== confianca.pontos ? (
                      <span className="small muted"> (soma {confianca.soma}, limitada a {confianca.pontos})</span>
                    ) : null}
                  </td>
                  <td>{confianca.pontos}</td>
                </tr>
              </tbody>
            </table>
            <div className="note">
              <Info size={17} aria-hidden="true" />
              <span>
                O cálculo parte da fonte mais confiável: base pública 90, sensor 80, registro comunitário 40. Com{' '}
                {LIMITE_CONFIRMACAO_AUTOMATICA} pontos ou mais, o evento é confirmado sem intervenção humana.
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
