// Regras de negócio do Sentinela Urbana.
// Cada bloco implementa uma regra do documento de requisitos (RN01 a RN08).

export const TIPOS = {
  alagamento: {
    rotulo: 'Alagamento',
    medida: 'Lâmina de água',
    unidade: 'cm',
    intensidades: [
      'Água acumulada na sarjeta ou na calçada (até 10 cm)',
      'Água cobre o meio-fio (11 a 30 cm)',
      'Água na altura da roda de um carro (31 a 50 cm)',
      'Água acima de 50 cm ou entrando nas casas',
    ],
    orientacoes: [
      'Não atravesse áreas alagadas a pé nem de carro.',
      'Afaste-se de postes, fios e bocas de lobo.',
      'Se a água subir, leve documentos e remédios para um ponto alto.',
      'Em emergência, ligue 199 (Defesa Civil) ou 193 (Bombeiros).',
    ],
  },
  calor: {
    rotulo: 'Calor extremo',
    medida: 'Temperatura do ar',
    unidade: '°C',
    intensidades: [
      'Calor forte (32 a 34 °C)',
      'Calor muito forte (35 a 37 °C)',
      'Calor intenso (38 a 40 °C)',
      'Calor extremo (acima de 40 °C)',
    ],
    orientacoes: [
      'Beba água com frequência, mesmo sem sede.',
      'Evite sol e esforço físico entre 10 h e 16 h.',
      'Dê atenção a idosos, crianças e pessoas doentes.',
      'Procure um lugar fresco e ventilado.',
    ],
  },
  energia: {
    rotulo: 'Falta de energia',
    medida: 'Duração da interrupção',
    unidade: 'h',
    intensidades: [
      'Até 1 hora sem energia',
      'Entre 1 e 4 horas sem energia',
      'Entre 4 e 12 horas sem energia',
      'Mais de 12 horas sem energia',
    ],
    orientacoes: [
      'Tire os aparelhos da tomada para evitar danos quando a energia voltar.',
      'Mantenha geladeira e freezer fechados.',
      'Não se aproxime de fios caídos.',
      'Quem depende de aparelho elétrico de saúde deve procurar uma unidade de atendimento.',
    ],
  },
  agua: {
    rotulo: 'Falta de água',
    medida: 'Duração da interrupção',
    unidade: 'h',
    intensidades: [
      'Até 1 hora sem água',
      'Entre 1 e 4 horas sem água',
      'Entre 4 e 12 horas sem água',
      'Mais de 12 horas sem água',
    ],
    orientacoes: [
      'Economize a água da caixa.',
      'Guarde água potável em recipientes limpos e tampados.',
      'Adie o uso de máquina de lavar e de mangueira.',
    ],
  },
  transporte: {
    rotulo: 'Transporte interrompido',
    medida: 'Duração da interrupção',
    unidade: 'h',
    intensidades: [
      'Até 1 hora de interrupção',
      'Entre 1 e 4 horas de interrupção',
      'Entre 4 e 12 horas de interrupção',
      'Mais de 12 horas de interrupção',
    ],
    orientacoes: [
      'Consulte rotas alternativas antes de sair.',
      'Evite plataformas e pontos lotados.',
      'Se puder, adie o deslocamento.',
    ],
  },
};

export const TIPOS_SERVICO = ['energia', 'agua', 'transporte'];

export const ROTULO_FONTE = {
  publica: 'Base pública',
  sensor: 'Sensor',
  comunidade: 'Registro comunitário',
};

// ---------- RN01: nível de confiança do dado ----------

export const BASE_CONFIANCA = { publica: 90, sensor: 80, comunidade: 40 };

export const PESOS_CONFIANCA = {
  fonteAdicional: 10,
  maximoFontesAdicionais: 2,
  foto: 10,
  relatorConfiavel: 10,
  validacaoAgente: 30,
  dadoAtrasado: -20,
  foraDaFaixa: -30,
};

export function classeConfianca(pontos) {
  if (pontos >= 75) return 'alta';
  if (pontos >= 50) return 'media';
  return 'baixa';
}

export const ROTULO_CONFIANCA = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export function calcularConfianca(evento) {
  const fontes = evento.fontes;
  const principal = fontes.reduce(
    (melhor, f) => (BASE_CONFIANCA[f.tipo] > BASE_CONFIANCA[melhor.tipo] ? f : melhor),
    fontes[0],
  );
  const fatores = [
    {
      rotulo: `Fonte principal: ${ROTULO_FONTE[principal.tipo].toLowerCase()}`,
      pontos: BASE_CONFIANCA[principal.tipo],
      base: true,
    },
  ];

  const independentes = new Set(fontes.map((f) => f.chave)).size;
  const adicionais = Math.min(independentes - 1, PESOS_CONFIANCA.maximoFontesAdicionais);
  if (adicionais > 0) {
    fatores.push({
      rotulo:
        adicionais === 1
          ? '1 fonte independente adicional'
          : `${adicionais} fontes independentes adicionais`,
      pontos: adicionais * PESOS_CONFIANCA.fonteAdicional,
    });
  }
  if (fontes.some((f) => f.tipo === 'comunidade' && f.foto)) {
    fatores.push({ rotulo: 'Registro comunitário com foto', pontos: PESOS_CONFIANCA.foto });
  }
  if (fontes.some((f) => f.tipo === 'comunidade' && f.relatorConfiavel)) {
    fatores.push({
      rotulo: 'Relator com 3 ou mais relatos confirmados',
      pontos: PESOS_CONFIANCA.relatorConfiavel,
    });
  }
  if (evento.validadoPorAgente) {
    fatores.push({
      rotulo: 'Validação por agente ou operador',
      pontos: PESOS_CONFIANCA.validacaoAgente,
    });
  }
  if (principal.atrasado) {
    fatores.push({ rotulo: 'Dado atrasado', pontos: PESOS_CONFIANCA.dadoAtrasado });
  }
  if (principal.foraDaFaixa) {
    fatores.push({
      rotulo: 'Leitura fora da faixa de operação',
      pontos: PESOS_CONFIANCA.foraDaFaixa,
    });
  }

  const soma = fatores.reduce((total, f) => total + f.pontos, 0);
  const pontos = Math.max(0, Math.min(100, soma));
  return { pontos, soma, classe: classeConfianca(pontos), fatores, principal };
}

// ---------- RN02: severidade ----------

const LIMITES = {
  alagamento: { normal: 5, faixas: [10, 30, 50], operacao: [0, 300] },
  calor: { normal: 32, faixas: [34, 37, 40], operacao: [-5, 55] },
  servico: { normal: 0, faixas: [1, 4, 12], operacao: [0, 240] },
};

function limitesDe(tipo) {
  return LIMITES[tipo] || LIMITES.servico;
}

// Devolve 0 quando a leitura está dentro do normal e não gera evento.
export function severidadePorValor(tipo, valor) {
  const { normal, faixas } = limitesDe(tipo);
  if (valor < normal) return 0;
  if (valor <= faixas[0]) return 1;
  if (valor <= faixas[1]) return 2;
  if (valor <= faixas[2]) return 3;
  return 4;
}

export function foraDaFaixa(tipo, valor) {
  const [minimo, maximo] = limitesDe(tipo).operacao;
  return valor < minimo || valor > maximo;
}

export function faixaDeOperacao(tipo) {
  return limitesDe(tipo).operacao;
}

// ---------- RN03 e RN04: exposição e nível de risco ----------

export const ROTULO_EXPOSICAO = { 1: 'Baixa', 2: 'Média', 3: 'Alta' };

export const NIVEIS = ['baixo', 'moderado', 'alto', 'critico'];
export const ROTULO_NIVEL = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
};

export function calcularRisco(evento) {
  const produto = evento.severidade * evento.exposicao;
  let nivel = 'baixo';
  if (produto >= 9) nivel = 'critico';
  else if (produto >= 6) nivel = 'alto';
  else if (produto >= 3) nivel = 'moderado';
  return { severidade: evento.severidade, exposicao: evento.exposicao, produto, nivel };
}

// ---------- RN05: prioridade ----------

const MATRIZ_PRIORIDADE = {
  critico: { alta: 'P1', media: 'P1', baixa: 'P2' },
  alto: { alta: 'P1', media: 'P2', baixa: 'P3' },
  moderado: { alta: 'P2', media: 'P3', baixa: 'P4' },
  baixo: { alta: 'P4', media: 'P4', baixa: 'P4' },
};

export function calcularPrioridade(nivel, classe) {
  return MATRIZ_PRIORIDADE[nivel][classe];
}

// ---------- RN06: confirmação ----------

export const LIMITE_CONFIRMACAO_AUTOMATICA = 75;

// ---------- RN07: canal por prioridade ----------

export const CANAIS_POR_PRIORIDADE = {
  P1: ['push', 'sms'],
  P2: ['push'],
  P3: ['central'],
  P4: [],
};

export const ROTULO_CANAL = {
  push: 'Push',
  sms: 'SMS',
  email: 'E-mail',
  central: 'Central do aplicativo',
};

export function geraAlerta(prioridade) {
  return prioridade !== 'P4';
}

// ---------- RN08: destinatários ----------

export const RAIO_INTERESSE_KM = 2;
export const RAIO_AGRUPAMENTO_KM = 0.5;
export const JANELA_AGRUPAMENTO_MIN = 30;

export function distanciaKm(a, b) {
  const rad = (grau) => (grau * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function deveNotificar(usuario, evento, nivel) {
  if (!usuario.consentimentos.notificacoes) return false;
  if (!usuario.tipos.includes(evento.tipo)) return false;
  const nivelSuficiente = NIVEIS.indexOf(nivel) >= NIVEIS.indexOf(usuario.nivelMinimo);
  if (!nivelSuficiente && nivel !== 'critico') return false;
  return usuario.locais.some((local) => distanciaKm(local, evento) <= RAIO_INTERESSE_KM);
}

// Canais efetivos: os da prioridade que o usuário mantém ligados.
export function canaisParaUsuario(prioridade, usuario) {
  const canais = CANAIS_POR_PRIORIDADE[prioridade].filter(
    (canal) => canal === 'central' || usuario.canais[canal],
  );
  return canais.length > 0 ? canais : ['central'];
}

// ---------- Ciclo de vida do evento (Diagrama de Estados) ----------

export const STATUS = {
  reportado: 'Reportado',
  validacao: 'Em validação',
  confirmado: 'Confirmado',
  alerta: 'Alerta emitido',
  monitoramento: 'Em monitoramento',
  encerrado: 'Encerrado',
  descartado: 'Descartado',
};

export const STATUS_ATIVOS = [STATUS.confirmado, STATUS.alerta, STATUS.monitoramento];
export const STATUS_ABERTOS = [STATUS.reportado, STATUS.validacao, ...STATUS_ATIVOS];

// Junta os três cálculos para as telas.
export function avaliar(evento) {
  const confianca = calcularConfianca(evento);
  const risco = calcularRisco(evento);
  const prioridade = calcularPrioridade(risco.nivel, confianca.classe);
  return { confianca, risco, prioridade };
}

export function formatarValor(evento) {
  if (evento.valor == null) return null;
  const unidade = TIPOS[evento.tipo].unidade;
  return `${String(evento.valor).replace('.', ',')} ${unidade}`;
}
