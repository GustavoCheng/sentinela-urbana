// Fluxo de um dado até a notificação, na mesma ordem do Diagrama de Sequência:
// ingestão -> validação e confiança -> classificação de risco -> notificação.
// No sistema real cada etapa é um serviço; no protótipo tudo roda no navegador.

import {
  TIPOS,
  TIPOS_SERVICO,
  STATUS,
  STATUS_ABERTOS,
  ROTULO_NIVEL,
  ROTULO_CONFIANCA,
  ROTULO_CANAL,
  LIMITE_CONFIRMACAO_AUTOMATICA,
  RAIO_AGRUPAMENTO_KM,
  JANELA_AGRUPAMENTO_MIN,
  avaliar,
  geraAlerta,
  deveNotificar,
  canaisParaUsuario,
  distanciaKm,
  severidadePorValor,
  foraDaFaixa,
} from './regras.js';
import { BAIRROS, bairroPorId, fontePorId } from '../data/seed.js';
import { ultimoDado } from './fontes.js';

export const DUAS_HORAS = 2 * 3_600_000;

const numero = (n) => String(n).replace('.', ',');
const confiancaTexto = (c) => `${c.pontos} (${ROTULO_CONFIANCA[c.classe]})`;

function mudar(evento, status, em, nota) {
  evento.status = status;
  evento.atualizadoEm = em;
  evento.historico.push({ status, em, nota });
}

function notificar(estado, dados) {
  estado.notificacoes.unshift({ id: `N-${estado.proximaNotificacao++}`, lida: false, ...dados });
}

function localMaisProximo(usuario, evento) {
  return usuario.locais
    .map((l) => ({ nome: l.nome, km: distanciaKm(l, evento) }))
    .sort((a, b) => a.km - b.km)[0];
}

export function bairroMaisProximo(ponto) {
  return BAIRROS.map((b) => ({ bairro: b, km: distanciaKm(b, ponto) })).sort((a, b) => a.km - b.km)[0];
}

// RN07 e RN08: escolhe destinatários e canais. Devolve a lista de quem foi avisado.
function enviarAlertas(estado, evento, avaliacao, em, tipo, anterior) {
  const { risco, prioridade, confianca } = avaliacao;
  const nivel = ROTULO_NIVEL[risco.nivel];
  const enviados = [];
  const titulo =
    tipo === 'atualizacao' ? `Alerta atualizado: risco ${nivel}` : `Alerta de risco ${nivel}`;
  const mudanca = anterior ? ` passou de ${ROTULO_NIVEL[anterior]} para ${nivel}` : '';

  const morador = estado.usuarios.morador;
  if (morador && !estado.contaExcluida) {
    const autor = evento.fontes.some((f) => f.autorId === morador.id);
    if (deveNotificar(morador, evento, risco.nivel)) {
      const perto = localMaisProximo(morador, evento);
      const canais = canaisParaUsuario(prioridade, morador);
      notificar(estado, {
        perfil: 'morador', eventoId: evento.id, tipo, titulo, canais, em,
        texto: `${evento.titulo}${mudanca}. ${perto.km < 0.1 ? `Fica junto de ${perto.nome}` : `Fica a ${numero(perto.km.toFixed(1))} km de ${perto.nome}`}. Confiança ${confiancaTexto(confianca)}.`,
      });
      enviados.push(`${morador.nome} (${canais.map((c) => ROTULO_CANAL[c]).join(' e ')})`);
    } else if (autor) {
      notificar(estado, {
        perfil: 'morador', eventoId: evento.id, tipo, canais: ['central'], em,
        titulo: 'Sua ocorrência gerou um alerta',
        texto: `${evento.titulo}: risco ${nivel}, prioridade ${prioridade}. Confiança ${confiancaTexto(confianca)}.`,
      });
      enviados.push(`${morador.nome} (autora do registro, ${ROTULO_CANAL.central})`);
    }
  }

  if (prioridade === 'P1') {
    const tituloEquipe = tipo === 'atualizacao' ? 'Alerta P1 atualizado' : 'Alerta P1 emitido';
    const texto = `${evento.titulo}${mudanca || `. Risco ${nivel}`}. Confiança ${confiancaTexto(confianca)}.`;
    notificar(estado, { perfil: 'agente', eventoId: evento.id, tipo, titulo: tituloEquipe, texto, canais: ['central'], em });
    if (TIPOS_SERVICO.includes(evento.tipo)) {
      notificar(estado, { perfil: 'operador', eventoId: evento.id, tipo, titulo: tituloEquipe, texto, canais: ['central'], em });
    }
  }
  return enviados;
}

// Passos 11 a 18 do Diagrama de Sequência.
function classificarEEmitir(estado, evento, em, passos) {
  const avaliacao = avaliar(evento);
  const { risco, prioridade } = avaliacao;
  const nivel = ROTULO_NIVEL[risco.nivel];
  passos.push({
    etapa: 'Classificação de risco',
    texto: `Severidade ${risco.severidade} × exposição ${risco.exposicao} = ${risco.produto}: risco ${nivel}, prioridade ${prioridade}.`,
  });
  if (!geraAlerta(prioridade)) {
    mudar(evento, STATUS.monitoramento, em, `Prioridade ${prioridade}: evento exibido apenas no painel, sem notificação.`);
    passos.push({ etapa: 'Notificação', texto: 'Prioridade P4: o evento aparece no painel, sem alerta.' });
    return;
  }
  mudar(evento, STATUS.alerta, em, `Risco ${nivel}, prioridade ${prioridade}. Alerta emitido.`);
  const enviados = enviarAlertas(estado, evento, avaliacao, em, 'alerta');
  passos.push({
    etapa: 'Notificação',
    texto: enviados.length
      ? `Alerta emitido para ${enviados.join('; ')}.`
      : 'Alerta emitido. Nenhum morador cadastrado tem local de interesse a até 2 km.',
  });
}

function avisarFila(estado, evento, avaliacao, em) {
  const texto = `${evento.titulo}. Prioridade ${avaliacao.prioridade}, confiança ${confiancaTexto(avaliacao.confianca)}.`;
  const dados = { eventoId: evento.id, tipo: 'validacao', titulo: 'Novo evento na fila de validação', texto, canais: ['central'], em };
  notificar(estado, { perfil: 'agente', ...dados });
  if (TIPOS_SERVICO.includes(evento.tipo)) notificar(estado, { perfil: 'operador', ...dados });
}

// Entrada de um dado: leitura de sensor ou registro comunitário.
// Devolve o novo estado e o resultado com os passos percorridos.
export function receberDado(estadoAtual, entrada, agora) {
  const estado = structuredClone(estadoAtual);
  const passos = [];
  let tipo;
  let ponto;
  let severidade;
  let fonte;
  let origemTexto;

  if (entrada.origem === 'sensor') {
    const cadastro = fontePorId(entrada.fonteId);
    const bairro = bairroPorId(cadastro.bairroId);
    const info = TIPOS[cadastro.mede];
    tipo = cadastro.mede;
    ponto = { lat: bairro.lat, lng: bairro.lng, bairroId: bairro.id };
    const fora = foraDaFaixa(tipo, entrada.valor);
    severidade = severidadePorValor(tipo, entrada.valor);
    origemTexto = `Leitura de ${numero(entrada.valor)} ${info.unidade} recebida de ${cadastro.id}`;
    passos.push({ etapa: 'Ingestão', texto: `${origemTexto}. Fonte autenticada e formato válido.` });
    if (!fora && severidade === 0) {
      passos.push({ etapa: 'Validação', texto: 'Leitura dentro do normal. Nenhum evento foi criado.' });
      return { estado: estadoAtual, resultado: { normal: true, passos } };
    }
    fonte = {
      chave: cadastro.id, tipo: 'sensor', fonteId: cadastro.id, nome: cadastro.nome, coletadoEm: agora,
      detalhe: `${info.medida} de ${numero(entrada.valor)} ${info.unidade}`,
      atrasado: cadastro.situacao === 'atrasada', foraDaFaixa: fora,
    };
  } else {
    const autor = entrada.autor;
    tipo = entrada.tipo;
    ponto = { lat: entrada.lat, lng: entrada.lng, bairroId: entrada.bairroId };
    severidade = entrada.severidade;
    origemTexto = 'Registro comunitário recebido pelo aplicativo';
    passos.push({ etapa: 'Ingestão', texto: `${origemTexto}. Formato válido.` });
    fonte = {
      chave: autor.id, tipo: 'comunidade', fonteId: 'COM-APP', nome: 'Registro comunitário',
      autorId: autor.id, autorNome: autor.nome, coletadoEm: agora,
      detalhe: entrada.descricao || TIPOS[tipo].intensidades[severidade - 1],
      foto: Boolean(entrada.foto), relatorConfiavel: autor.relatosConfirmados >= 3,
    };
  }

  // RF04: agrupa com evento aberto do mesmo tipo, a até 500 m e 30 min.
  const existente = estado.eventos.find(
    (e) =>
      STATUS_ABERTOS.includes(e.status) &&
      e.tipo === tipo &&
      distanciaKm(e, ponto) <= RAIO_AGRUPAMENTO_KM &&
      agora - ultimoDado(e, agora) <= JANELA_AGRUPAMENTO_MIN * 60_000,
  );

  if (existente) {
    const antes = avaliar(existente);
    const posicao = existente.fontes.findIndex((f) => f.chave === fonte.chave);
    if (posicao >= 0) existente.fontes[posicao] = fonte;
    else existente.fontes.push(fonte);
    const soComunidade = existente.fontes.every((f) => f.tipo === 'comunidade');
    if (entrada.origem === 'sensor') {
      existente.severidade = Math.max(severidade, 1);
      existente.valor = entrada.valor;
    } else if (soComunidade) {
      existente.severidade = Math.max(existente.severidade, severidade);
    }
    existente.atualizadoEm = agora;
    const depois = avaliar(existente);
    passos.push({
      etapa: 'Validação',
      texto: `Dado agrupado ao evento ${existente.id}: mesmo tipo, a menos de 500 m e de 30 min. Confiança ${confiancaTexto(depois.confianca)}.`,
    });

    if (existente.status === STATUS.validacao) {
      if (depois.confianca.pontos >= LIMITE_CONFIRMACAO_AUTOMATICA) {
        mudar(existente, STATUS.confirmado, agora, 'Confirmação automática: nova fonte elevou a confiança para 75 ou mais.');
        classificarEEmitir(estado, existente, agora, passos);
      } else {
        passos.push({ etapa: 'Fila de validação', texto: `O evento continua aguardando um agente, com prioridade ${depois.prioridade}.` });
      }
    } else if (depois.risco.nivel !== antes.risco.nivel) {
      // RN09: mudança de nível reemite o alerta.
      const de = ROTULO_NIVEL[antes.risco.nivel];
      const para = ROTULO_NIVEL[depois.risco.nivel];
      passos.push({ etapa: 'Classificação de risco', texto: `Risco passou de ${de} para ${para}. Prioridade ${depois.prioridade}.` });
      if (geraAlerta(depois.prioridade)) {
        mudar(existente, STATUS.alerta, agora, `Nova leitura: risco passou de ${de} para ${para}. Alerta reemitido.`);
        const enviados = enviarAlertas(estado, existente, depois, agora, 'atualizacao', antes.risco.nivel);
        passos.push({
          etapa: 'Notificação',
          texto: enviados.length ? `Alerta reemitido para ${enviados.join('; ')}.` : 'Alerta reemitido. Nenhum morador cadastrado na área.',
        });
      } else {
        mudar(existente, STATUS.monitoramento, agora, `Nova leitura: risco passou de ${de} para ${para}. Sem novo alerta (prioridade P4).`);
        passos.push({ etapa: 'Notificação', texto: 'Prioridade P4: nenhum alerta novo.' });
      }
    } else {
      passos.push({ etapa: 'Classificação de risco', texto: `Risco mantido em ${ROTULO_NIVEL[depois.risco.nivel]}. Nenhum alerta novo.` });
    }

    if (entrada.origem === 'comunidade') {
      notificar(estado, {
        perfil: 'morador', eventoId: existente.id, tipo: 'ocorrencia', canais: ['central'], em: agora,
        titulo: 'Seu registro reforçou um evento',
        texto: `Sua ocorrência foi agrupada ao evento ${existente.id} (${existente.titulo}).`,
      });
    }
    return { estado, resultado: { eventoId: existente.id, agrupado: true, passos } };
  }

  // Evento novo: nasce Reportado e segue para Em validação.
  const bairro = bairroPorId(ponto.bairroId);
  const evento = {
    id: `EV-${estado.proximoEvento++}`,
    tipo,
    bairroId: bairro.id,
    lat: ponto.lat,
    lng: ponto.lng,
    titulo: `${TIPOS[tipo].rotulo} ${bairro.prep} ${bairro.nome}`,
    descricao:
      entrada.origem === 'sensor'
        ? `${fonte.nome} registrou ${fonte.detalhe.toLowerCase()}.`
        : entrada.descricao || TIPOS[tipo].intensidades[severidade - 1],
    severidade: Math.max(severidade, 1),
    valor: entrada.origem === 'sensor' ? entrada.valor : null,
    exposicao: bairro.exposicao,
    status: STATUS.reportado,
    validadoPorAgente: false,
    criadoEm: agora,
    atualizadoEm: agora,
    fontes: [fonte],
    historico: [],
  };
  mudar(
    evento,
    STATUS.reportado,
    agora,
    entrada.origem === 'sensor'
      ? `Leitura de ${fonte.nome} aceita pela ingestão.`
      : 'Registro comunitário aceito pela ingestão.',
  );
  const avaliacao = avaliar(evento);
  const automatico = avaliacao.confianca.pontos >= LIMITE_CONFIRMACAO_AUTOMATICA;
  mudar(
    evento,
    STATUS.validacao,
    agora,
    `Dado válido. Confiança ${confiancaTexto(avaliacao.confianca)}${automatico ? '.' : ': aguardando um agente.'}`,
  );
  estado.eventos.unshift(evento);
  passos.push({
    etapa: 'Validação',
    texto: `Evento ${evento.id} criado. Confiança ${confiancaTexto(avaliacao.confianca)}${fonte.foraDaFaixa ? ', com desconto por leitura fora da faixa' : ''}${fonte.atrasado ? ', com desconto por dado atrasado' : ''}.`,
  });

  if (automatico) {
    mudar(evento, STATUS.confirmado, agora, 'Confirmação automática: confiança de 75 ou mais.');
    classificarEEmitir(estado, evento, agora, passos);
  } else {
    passos.push({
      etapa: 'Fila de validação',
      texto: `Confiança abaixo de 75: o evento aguarda um agente, com prioridade ${avaliacao.prioridade}.`,
    });
    avisarFila(estado, evento, avaliacao, agora);
  }

  if (entrada.origem === 'comunidade') {
    notificar(estado, {
      perfil: 'morador', eventoId: evento.id, tipo: 'ocorrencia', canais: ['central'], em: agora,
      titulo: 'Registro recebido',
      texto: `Sua ocorrência ${evento.id} (${evento.titulo}) está ${automatico ? 'confirmada' : 'em validação'}.`,
    });
  }
  return { estado, resultado: { eventoId: evento.id, agrupado: false, passos, avaliacao: avaliar(evento) } };
}

// RF14: decisão do agente ou operador na fila de validação.
export function validarEvento(estadoAtual, eventoId, decisao, agente, justificativa, agora) {
  const estado = structuredClone(estadoAtual);
  const evento = estado.eventos.find((e) => e.id === eventoId);
  if (!evento || evento.status !== STATUS.validacao) return { estado: estadoAtual, resultado: null };
  const quem = `${agente.nome} (${agente.papel})`;
  const morador = estado.usuarios.morador;
  const doMorador = evento.fontes.some((f) => f.autorId === morador.id);
  const passos = [];

  if (doMorador) {
    estado.auditoria.unshift({
      em: agora,
      texto: `${quem} consultou a identificação do autor para validar a ocorrência ${evento.id}.`,
    });
  }

  if (decisao === 'confirmar') {
    evento.validadoPorAgente = true;
    mudar(evento, STATUS.confirmado, agora, `Confirmado por ${quem}. ${justificativa}`.trim());
    if (doMorador) morador.relatosConfirmados += 1;
    classificarEEmitir(estado, evento, agora, passos);
  } else {
    mudar(evento, STATUS.descartado, agora, `Descartado por ${quem}. Motivo: ${justificativa}`);
    if (doMorador && !estado.contaExcluida) {
      notificar(estado, {
        perfil: 'morador', eventoId: evento.id, tipo: 'ocorrencia', canais: ['central'], em: agora,
        titulo: 'Ocorrência descartada',
        texto: `Sua ocorrência ${evento.id} foi descartada. Motivo: ${justificativa}`,
      });
    }
  }
  return { estado, resultado: { eventoId, passos } };
}

// RN09: encerramento manual.
export function encerrarEvento(estadoAtual, eventoId, agente, justificativa, agora) {
  const estado = structuredClone(estadoAtual);
  const evento = estado.eventos.find((e) => e.id === eventoId);
  if (!evento) return { estado: estadoAtual, resultado: null };
  mudar(evento, STATUS.encerrado, agora, `Encerrado por ${agente.nome} (${agente.papel}). ${justificativa}`.trim());
  const morador = estado.usuarios.morador;
  const avisado =
    estado.notificacoes.some((n) => n.perfil === 'morador' && n.eventoId === eventoId) ||
    evento.fontes.some((f) => f.autorId === morador.id);
  if (avisado && !estado.contaExcluida) {
    notificar(estado, {
      perfil: 'morador', eventoId, tipo: 'encerramento', canais: ['central'], em: agora,
      titulo: 'Evento encerrado',
      texto: `${evento.titulo} foi encerrado. ${justificativa}`.trim(),
    });
  }
  return { estado, resultado: { eventoId } };
}

// Transições automáticas, checadas a cada atualização do relógio do protótipo.
export function transicoesAutomaticas(estadoAtual, agora) {
  const precisa = estadoAtual.eventos.some(
    (e) =>
      (e.status === STATUS.alerta && agora - e.atualizadoEm >= 5_000) ||
      (e.status === STATUS.validacao && agora - e.atualizadoEm >= DUAS_HORAS),
  );
  if (!precisa) return estadoAtual;
  const estado = structuredClone(estadoAtual);
  for (const evento of estado.eventos) {
    if (evento.status === STATUS.alerta && agora - evento.atualizadoEm >= 5_000) {
      mudar(evento, STATUS.monitoramento, agora, 'Notificações enviadas.');
    } else if (evento.status === STATUS.validacao && agora - evento.atualizadoEm >= DUAS_HORAS) {
      mudar(evento, STATUS.descartado, agora, 'Descartado automaticamente: 2 h sem validação e sem nova fonte.');
    }
  }
  return estado;
}
