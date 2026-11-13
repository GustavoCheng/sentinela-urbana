import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Waves, ThermometerSun, ZapOff, Droplet, TrainFront, CircleCheck, CircleAlert, TriangleAlert, Siren,
  Cpu, Landmark, Users, ChevronRight, X,
} from 'lucide-react';
import { ROTULO_NIVEL, ROTULO_CONFIANCA, ROTULO_FONTE, STATUS, TIPOS } from '../domain/regras.js';
import { ultimoDado } from '../domain/fontes.js';

export const ICONE_TIPO = { alagamento: Waves, calor: ThermometerSun, energia: ZapOff, agua: Droplet, transporte: TrainFront };
export const ICONE_NIVEL = { baixo: CircleCheck, moderado: CircleAlert, alto: TriangleAlert, critico: Siren };
export const ICONE_FONTE = { sensor: Cpu, publica: Landmark, comunidade: Users };

export function TipoIcone({ tipo, nivel, size = 20 }) {
  const Icone = ICONE_TIPO[tipo];
  return (
    <span className={`tipo-ic ${nivel ? `nivel-${nivel}` : ''}`} title={TIPOS[tipo].rotulo}>
      <Icone size={size} aria-hidden="true" />
    </span>
  );
}

// RNF06: o nível aparece sempre com ícone e texto, além da cor.
export function NivelBadge({ nivel, grande }) {
  const Icone = ICONE_NIVEL[nivel];
  return (
    <span className={`badge nivel-${nivel} ${grande ? 'badge-lg' : ''}`}>
      <Icone size={grande ? 17 : 14} aria-hidden="true" />
      Risco {ROTULO_NIVEL[nivel]}
    </span>
  );
}

export function Medidor({ classe }) {
  return (
    <span className={`meter ${classe}`} aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

export function ConfiancaBadge({ confianca, grande }) {
  return (
    <span className={`badge conf ${grande ? 'badge-lg' : ''}`} title="Nível de confiança do dado (0 a 100)">
      <Medidor classe={confianca.classe} />
      Confiança {confianca.pontos} · {ROTULO_CONFIANCA[confianca.classe]}
    </span>
  );
}

const DESCRICAO_PRIORIDADE = {
  P1: 'Prioridade 1: push e SMS imediatos',
  P2: 'Prioridade 2: notificação push',
  P3: 'Prioridade 3: central de notificações',
  P4: 'Prioridade 4: apenas no painel',
};

export function PrioridadeTag({ prioridade }) {
  return (
    <span className={`ptag ptag-${prioridade}`} title={DESCRICAO_PRIORIDADE[prioridade]}>
      <span className="sr-only">Prioridade </span>
      {prioridade}
    </span>
  );
}

const SLUG_STATUS = {
  [STATUS.reportado]: 'reportado',
  [STATUS.validacao]: 'em-validacao',
  [STATUS.confirmado]: 'confirmado',
  [STATUS.alerta]: 'alerta-emitido',
  [STATUS.monitoramento]: 'em-monitoramento',
  [STATUS.encerrado]: 'encerrado',
  [STATUS.descartado]: 'descartado',
};

export function StatusTag({ status }) {
  return <span className={`status status-${SLUG_STATUS[status]}`}>{status}</span>;
}

export function FonteChip({ tipo, quantidade }) {
  const Icone = ICONE_FONTE[tipo];
  return (
    <span className={`chip fonte-${tipo}`}>
      <Icone size={13} aria-hidden="true" />
      {ROTULO_FONTE[tipo]}
      {quantidade > 1 ? ` × ${quantidade}` : ''}
    </span>
  );
}

// Origem resumida: um chip por tipo de fonte do evento.
export function FontesResumo({ fontes }) {
  const contagem = {};
  fontes.forEach((f) => { contagem[f.tipo] = (contagem[f.tipo] || 0) + 1; });
  return (
    <>
      {['publica', 'sensor', 'comunidade']
        .filter((t) => contagem[t])
        .map((t) => <FonteChip key={t} tipo={t} quantidade={contagem[t]} />)}
    </>
  );
}

export function tempoRelativo(ts, agora) {
  const s = Math.max(0, Math.round((agora - ts) / 1000));
  if (s < 5) return 'agora';
  if (s < 60) return `há ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export function dataHora(ts) {
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function duracao(ms) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

export function Vazio({ icone: Icone, titulo, children }) {
  return (
    <div className="empty">
      {Icone ? <Icone size={34} aria-hidden="true" /> : null}
      <h3>{titulo}</h3>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Modal({ titulo, aoFechar, children, rodape }) {
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [aoFechar]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="row between">
          <h2>{titulo}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={aoFechar} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        {children}
        {rodape ? <div className="modal-foot">{rodape}</div> : null}
      </div>
    </div>
  );
}

export function Alternador({ marcado, aoMudar, titulo, descricao }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} />
      <span className="track" aria-hidden="true" />
      <span>
        <span className="strong">{titulo}</span>
        {descricao ? <span className="hint" style={{ display: 'block' }}>{descricao}</span> : null}
      </span>
    </label>
  );
}

// Linha de alerta usada no painel, na lista e nas ocorrências.
export function LinhaAlerta({ evento, agora, para }) {
  return (
    <Link className="alert-row" to={para || `/alertas/${evento.id}`}>
      <PrioridadeTag prioridade={evento.prioridade} />
      <TipoIcone tipo={evento.tipo} nivel={evento.risco.nivel} />
      <div className="grow">
        <div className="title">{evento.titulo}</div>
        <div className="meta">
          <NivelBadge nivel={evento.risco.nivel} />
          <ConfiancaBadge confianca={evento.confianca} />
          <FontesResumo fontes={evento.fontes} />
        </div>
      </div>
      <div className="side">
        <StatusTag status={evento.status} />
        <span className="tiny muted">Atualizado {tempoRelativo(ultimoDado(evento, agora), agora)}</span>
      </div>
      <ChevronRight size={18} className="chev" aria-hidden="true" />
    </Link>
  );
}

const ETAPAS = [STATUS.reportado, STATUS.validacao, STATUS.confirmado, STATUS.alerta, STATUS.monitoramento, STATUS.encerrado];

// Posição do evento no ciclo de vida do Diagrama de Estados.
export function CicloDeVida({ evento }) {
  if (evento.status === STATUS.descartado) {
    const etapas = [STATUS.reportado, STATUS.validacao, STATUS.descartado];
    const passou = evento.historico.some((h) => h.status === STATUS.validacao);
    return (
      <ol className="life dropped" aria-label="Ciclo de vida do evento">
        {etapas.map((e, i) => (
          <li key={e} className={i === 2 ? 'done now' : i === 0 || passou ? 'done' : ''}><span>{e}</span></li>
        ))}
      </ol>
    );
  }
  const atual = ETAPAS.indexOf(evento.status);
  const semAlerta = !evento.historico.some((h) => h.status === STATUS.alerta);
  return (
    <ol className={`life ${evento.status === STATUS.encerrado ? 'ended' : ''}`} aria-label="Ciclo de vida do evento">
      {ETAPAS.map((e, i) => {
        const pulou = e === STATUS.alerta && semAlerta && atual > i;
        const classe = i === atual ? 'done now' : i < atual && !pulou ? 'done' : '';
        return <li key={e} className={classe}><span>{e}</span></li>;
      })}
    </ol>
  );
}
