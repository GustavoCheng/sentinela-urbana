import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, CheckCheck, CircleCheck, ClipboardCheck, ClipboardList, Inbox, Mail, MessageSquare, RefreshCw, Smartphone } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Vazio, dataHora, tempoRelativo } from '../components/ui.jsx';
import { ROTULO_CANAL } from '../domain/regras.js';

const ICONE = {
  alerta: BellRing,
  atualizacao: RefreshCw,
  ocorrencia: ClipboardList,
  validacao: ClipboardCheck,
  encerramento: CircleCheck,
};
const CLASSE = { alerta: 'alerta', atualizacao: 'alerta', validacao: 'validacao', encerramento: 'encerramento' };
const ICONE_CANAL = { push: Smartphone, sms: MessageSquare, email: Mail, central: Inbox };

// Tela 6: Central de notificações (RF11 e RF12).
export default function Notificacoes() {
  const { notificacoes, naoLidas, eventos, equipe, agora, acoes } = useApp();
  const [aba, setAba] = useState('todas');
  const navegar = useNavigate();
  const lista = aba === 'naoLidas' ? notificacoes.filter((n) => !n.lida) : notificacoes;

  const abrir = (n) => {
    acoes.marcarLida(n.id);
    if (n.tipo === 'validacao' && equipe) navegar('/validacao');
    else if (eventos.some((e) => e.id === n.eventoId)) navegar(`/alertas/${n.eventoId}`);
  };

  return (
    <>
      <p className="page-intro">
        Todo aviso enviado a você fica aqui, com o canal usado. Alertas P1 chegam por push e SMS, P2 por push e P3
        apenas nesta central.
      </p>

      <div className="row-wrap between">
        <div className="tabs" role="tablist" aria-label="Filtro de notificações">
          <button type="button" role="tab" aria-selected={aba === 'todas'} onClick={() => setAba('todas')}>
            Todas ({notificacoes.length})
          </button>
          <button type="button" role="tab" aria-selected={aba === 'naoLidas'} onClick={() => setAba('naoLidas')}>
            Não lidas ({naoLidas})
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={naoLidas === 0}
          onClick={() => { acoes.marcarTodasLidas(); acoes.avisar('Todas as notificações foram marcadas como lidas.'); }}
        >
          <CheckCheck size={16} aria-hidden="true" /> Marcar todas como lidas
        </button>
      </div>

      <section className="card card-flush">
        {lista.length === 0 ? (
          <Vazio icone={Bell} titulo={aba === 'naoLidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}>
            Novos alertas da sua região aparecem aqui.
          </Vazio>
        ) : (
          lista.map((n) => {
            const Icone = ICONE[n.tipo] || Bell;
            return (
              <button key={n.id} type="button" className={`notif ${n.lida ? '' : 'unread'}`} onClick={() => abrir(n)}>
                <span className={`ic ${CLASSE[n.tipo] || ''}`}><Icone size={19} aria-hidden="true" /></span>
                <span className="grow">
                  <span className="strong" style={{ display: 'block' }}>{n.titulo}</span>
                  <span className="small" style={{ display: 'block', color: 'var(--ink-2)' }}>{n.texto}</span>
                  <span className="row-wrap" style={{ marginTop: 7 }}>
                    {n.canais.map((c) => {
                      const IconeCanal = ICONE_CANAL[c];
                      return (
                        <span key={c} className="chip"><IconeCanal size={12} aria-hidden="true" /> {ROTULO_CANAL[c]}</span>
                      );
                    })}
                    <span className="tiny muted">{dataHora(n.em)} · {tempoRelativo(n.em, agora)}</span>
                  </span>
                </span>
                {n.lida ? null : <span className="unread-dot" aria-label="Não lida" />}
              </button>
            );
          })
        )}
      </section>
    </>
  );
}
