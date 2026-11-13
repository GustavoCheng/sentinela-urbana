// Atualização das fontes. No protótipo, sensores e bases públicas ativas "enviam" dados
// no intervalo esperado (RNF01): o horário da última leitura é simulado a partir do relógio.

import { fontePorId } from '../data/seed.js';
import { STATUS_ATIVOS } from './regras.js';

export function ultimaAtualizacao(fonte, agora) {
  if (fonte.atrasoMin) return agora - fonte.atrasoMin * 60_000;
  if (!fonte.intervaloSeg) return null;
  const intervalo = fonte.intervaloSeg * 1_000;
  const deslocamento = (fonte.id.charCodeAt(fonte.id.length - 1) * 7_919) % intervalo;
  return agora - ((agora + deslocamento) % intervalo);
}

// Horário da coleta de uma fonte dentro de um evento. Enquanto o evento está ativo,
// uma fonte periódica ativa continua enviando leituras.
export function coletaDaFonte(fonte, evento, agora) {
  if (fonte.tipo === 'comunidade' || !STATUS_ATIVOS.includes(evento.status)) return fonte.coletadoEm;
  const cadastro = fontePorId(fonte.fonteId);
  if (!cadastro || cadastro.situacao !== 'ativa') return fonte.coletadoEm;
  return Math.max(fonte.coletadoEm, ultimaAtualizacao(cadastro, agora));
}

// Momento do dado mais recente do evento.
export function ultimoDado(evento, agora) {
  return Math.max(evento.atualizadoEm, ...evento.fontes.map((f) => coletaDaFonte(f, evento, agora)));
}
