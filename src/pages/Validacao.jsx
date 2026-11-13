import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, CircleX, ClipboardCheck, Clock, Hourglass, Info, UserRound, X } from 'lucide-react';
import { useApp, ehAtivo, emValidacao, porPrioridade, visivelNaFila } from '../store.jsx';
import {
  ConfiancaBadge, FonteChip, Modal, NivelBadge, PrioridadeTag, TipoIcone, Vazio, duracao, tempoRelativo,
} from '../components/ui.jsx';
import { CANAIS_POR_PRIORIDADE, ROTULO_CONFIANCA, avaliar } from '../domain/regras.js';
import { DUAS_HORAS } from '../domain/pipeline.js';
import { ultimoDado } from '../domain/fontes.js';

const ACOES = {
  confirmar: {
    titulo: 'Confirmar evento',
    botao: 'Confirmar evento',
    classe: 'btn-ok',
    sugestoes: ['Confirmado por telefone com a subprefeitura.', 'Imagens de câmera confirmam o relato.', 'Equipe em campo confirmou.'],
  },
  descartar: {
    titulo: 'Descartar evento',
    botao: 'Descartar evento',
    classe: 'btn-danger',
    sugestoes: ['Relato duplicado.', 'Não confirmado pela equipe em campo.', 'Informação insuficiente.'],
  },
  encerrar: {
    titulo: 'Encerrar evento',
    botao: 'Encerrar evento',
    classe: 'btn-primary',
    sugestoes: ['Situação normalizada.', 'Serviço restabelecido.', 'Nível da água voltou ao normal.'],
  },
};

function canais(prioridade) {
  const lista = CANAIS_POR_PRIORIDADE[prioridade];
  const nomes = { push: 'push', sms: 'SMS', central: 'central do aplicativo' };
  return lista.length ? `alerta por ${lista.map((c) => nomes[c]).join(' e ')}` : 'sem alerta, apenas painel';
}

// Tela 9: Fila de validação (RF14, RN06).
export default function Validacao() {
  const { eventos, perfil, agora, acoes } = useApp();
  const [modal, setModal] = useState(null);
  const [justificativa, setJustificativa] = useState('');

  const fila = eventos.filter((e) => emValidacao(e) && visivelNaFila(e, perfil)).sort(porPrioridade);
  const ativos = eventos.filter((e) => ehAtivo(e) && visivelNaFila(e, perfil)).sort(porPrioridade);

  const abrir = (evento, acao) => { setModal({ evento, acao }); setJustificativa(''); };
  const fechar = () => setModal(null);

  const executar = () => {
    const { evento, acao } = modal;
    const texto = justificativa.trim();
    if (acao === 'encerrar') {
      acoes.encerrar(evento.id, texto);
      acoes.avisar(`${evento.id} encerrado. Os moradores avisados foram notificados.`);
    } else {
      const r = acoes.validar(evento.id, acao, texto);
      const ultimo = r && r.passos.length ? r.passos[r.passos.length - 1].texto : '';
      acoes.avisar(acao === 'confirmar' ? `${evento.id} confirmado. ${ultimo}` : `${evento.id} descartado.`);
    }
    fechar();
  };

  return (
    <>
      <p className="page-intro">
        Eventos com confiança abaixo de 75 esperam a sua decisão, em ordem de prioridade.
        {perfil === 'operador' ? ' Como operadora, você vê apenas interrupções de energia, água e transporte.' : ''}
      </p>

      <h2>Aguardando validação ({fila.length})</h2>
      {fila.length === 0 ? (
        <section className="card">
          <Vazio icone={ClipboardCheck} titulo="Fila vazia">Nenhum evento aguardando validação.</Vazio>
        </section>
      ) : (
        fila.map((e) => {
          const seConfirmar = avaliar({ ...e, validadoPorAgente: true });
          const restante = DUAS_HORAS - (agora - e.atualizadoEm);
          return (
            <article key={e.id} className="queue">
              <div className="detail-head">
                <PrioridadeTag prioridade={e.prioridade} />
                <TipoIcone tipo={e.tipo} nivel={e.risco.nivel} />
                <div className="grow">
                  <h3 style={{ fontSize: '1.02rem' }}>{e.titulo}</h3>
                  <p className="small muted">{e.id} · {e.bairro.nome}</p>
                </div>
                <div className="row-wrap">
                  <NivelBadge nivel={e.risco.nivel} />
                  <ConfiancaBadge confianca={e.confianca} />
                </div>
              </div>

              <div className="kv">
                <span><Clock size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Na fila <b>{tempoRelativo(e.criadoEm, agora)}</b></span>
                <span><Hourglass size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Descarte automático em <b>{duracao(restante)}</b></span>
                <span>Cálculo: <b>{e.confianca.fatores.map((f) => `${f.rotulo.toLowerCase()} ${f.base ? '' : f.pontos > 0 ? '+' : '−'}${Math.abs(f.pontos)}`).join(', ')}</b></span>
              </div>

              <ul className="stack-sm">
                {e.fontes.map((f) => (
                  <li key={f.chave} className="source">
                    <div className="row-wrap">
                      <FonteChip tipo={f.tipo} />
                      {f.tipo === 'comunidade' ? (
                        <span className="small strong"><UserRound size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {f.autorNome}</span>
                      ) : (
                        <span className="small strong">{f.nome} ({f.fonteId})</span>
                      )}
                      <span className="tiny muted">{tempoRelativo(f.coletadoEm, agora)}</span>
                      {f.foto ? <span className="chip chip-ok"><Camera size={12} aria-hidden="true" /> Com foto</span> : null}
                      {f.atrasado ? <span className="chip chip-warn">Dado atrasado</span> : null}
                      {f.foraDaFaixa ? <span className="chip chip-bad">Fora da faixa</span> : null}
                    </div>
                    <p className="small">{f.detalhe}</p>
                  </li>
                ))}
              </ul>

              <div className="note">
                <Info size={17} aria-hidden="true" />
                <span>
                  Se você confirmar: confiança {seConfirmar.confianca.pontos} ({ROTULO_CONFIANCA[seConfirmar.confianca.classe]}),
                  prioridade {seConfirmar.prioridade}, {canais(seConfirmar.prioridade)}.
                </span>
              </div>

              <div className="queue-actions">
                <Link to={`/alertas/${e.id}/origem`} className="btn btn-ghost btn-sm">Ver origem e confiança</Link>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => abrir(e, 'descartar')}>
                  <X size={15} aria-hidden="true" /> Descartar
                </button>
                <button type="button" className="btn btn-ok btn-sm" onClick={() => abrir(e, 'confirmar')}>
                  <Check size={15} aria-hidden="true" /> Confirmar
                </button>
              </div>
            </article>
          );
        })
      )}

      <h2 style={{ marginTop: 8 }}>Em acompanhamento ({ativos.length})</h2>
      <section className="card card-flush">
        {ativos.length === 0 ? (
          <Vazio icone={ClipboardCheck} titulo="Nenhum evento ativo" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Prioridade</th><th>Evento</th><th>Risco</th><th>Confiança</th><th>Atualizado</th><th><span className="sr-only">Ações</span></th></tr>
              </thead>
              <tbody>
                {ativos.map((e) => (
                  <tr key={e.id}>
                    <td><PrioridadeTag prioridade={e.prioridade} /></td>
                    <td>
                      <Link to={`/alertas/${e.id}`} className="strong">{e.titulo}</Link>
                      <div className="tiny muted">{e.id} · {e.status}</div>
                    </td>
                    <td><NivelBadge nivel={e.risco.nivel} /></td>
                    <td><ConfiancaBadge confianca={e.confianca} /></td>
                    <td className="nowrap small">{tempoRelativo(ultimoDado(e, agora), agora)}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => abrir(e, 'encerrar')}>
                        <CircleX size={15} aria-hidden="true" /> Encerrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal ? (
        <Modal
          titulo={`${ACOES[modal.acao].titulo}: ${modal.evento.id}`}
          aoFechar={fechar}
          rodape={(
            <>
              <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button
                type="button"
                className={`btn ${ACOES[modal.acao].classe}`}
                disabled={justificativa.trim().length < 5}
                onClick={executar}
              >
                {ACOES[modal.acao].botao}
              </button>
            </>
          )}
        >
          <p>{modal.evento.titulo}.</p>
          <div className="field">
            <label htmlFor="justificativa">Justificativa</label>
            <textarea
              id="justificativa"
              className="textarea"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Explique a decisão em uma frase."
            />
            <div className="row-wrap">
              {ACOES[modal.acao].sugestoes.map((s) => (
                <button key={s} type="button" className="pill" onClick={() => setJustificativa(s)}>{s}</button>
              ))}
            </div>
            <span className="hint">Obrigatória. Fica registrada no histórico do evento e na trilha de auditoria.</span>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
