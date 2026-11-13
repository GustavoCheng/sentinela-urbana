// Dados fictícios da demonstração. Nenhum valor vem de sensor ou órgão real.
import { STATUS } from '../domain/regras.js';

export const VERSAO = 1;

export const BAIRROS = [
  { id: 'jardim-helena', nome: 'Jardim Helena', prep: 'no', lat: -23.4795, lng: -46.4185, exposicao: 3, criterio: 'Alta densidade e estação de trem a menos de 500 m' },
  { id: 'sao-miguel', nome: 'São Miguel Paulista', prep: 'em', lat: -23.4885, lng: -46.4285, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'bras', nome: 'Brás', prep: 'no', lat: -23.545, lng: -46.616, exposicao: 3, criterio: 'Estação de trem e metrô e comércio de alta circulação' },
  { id: 'se', nome: 'Sé', prep: 'na', lat: -23.549, lng: -46.629, exposicao: 3, criterio: 'Alta circulação de pedestres e estação de metrô' },
  { id: 'mooca', nome: 'Mooca', prep: 'na', lat: -23.556, lng: -46.603, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'vila-prudente', nome: 'Vila Prudente', prep: 'na', lat: -23.58, lng: -46.581, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'pinheiros', nome: 'Pinheiros', prep: 'em', lat: -23.566, lng: -46.702, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'lapa', nome: 'Lapa', prep: 'na', lat: -23.523, lng: -46.705, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'butanta', nome: 'Butantã', prep: 'no', lat: -23.569, lng: -46.728, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'santana', nome: 'Santana', prep: 'em', lat: -23.502, lng: -46.625, exposicao: 2, criterio: 'Área residencial e comercial' },
  { id: 'bela-vista', nome: 'Bela Vista', prep: 'na', lat: -23.561, lng: -46.647, exposicao: 3, criterio: 'Hospitais a menos de 500 m' },
  { id: 'parque-do-carmo', nome: 'Parque do Carmo', prep: 'no', lat: -23.575, lng: -46.465, exposicao: 1, criterio: 'Área de parque, com pouca circulação' },
];

export const bairroPorId = (id) => BAIRROS.find((b) => b.id === id);

export const FONTES = [
  { id: 'S-NA-014', tipo: 'sensor', nome: 'Sensor de nível do Córrego Itaim', mede: 'alagamento', bairroId: 'jardim-helena', intervaloSeg: 60, situacao: 'ativa' },
  { id: 'S-NA-021', tipo: 'sensor', nome: 'Sensor de nível do Rio Tamanduateí', mede: 'alagamento', bairroId: 'mooca', intervaloSeg: 60, situacao: 'ativa' },
  { id: 'S-TP-032', tipo: 'sensor', nome: 'Estação de temperatura da Sé', mede: 'calor', bairroId: 'se', intervaloSeg: 60, situacao: 'ativa' },
  { id: 'S-TP-038', tipo: 'sensor', nome: 'Estação de temperatura de Santana', mede: 'calor', bairroId: 'santana', intervaloSeg: 60, situacao: 'ativa' },
  { id: 'S-TP-041', tipo: 'sensor', nome: 'Estação de temperatura da Lapa', mede: 'calor', bairroId: 'lapa', intervaloSeg: 60, situacao: 'atrasada', atrasoMin: 12 },
  { id: 'S-NA-009', tipo: 'sensor', nome: 'Sensor de nível do Córrego Pirajuçara', mede: 'alagamento', bairroId: 'butanta', intervaloSeg: 60, situacao: 'fora', atrasoMin: 190 },
  { id: 'BP-MET', tipo: 'publica', nome: 'Base de meteorologia', mede: 'calor', intervaloSeg: 600, situacao: 'ativa' },
  { id: 'BP-DC', tipo: 'publica', nome: 'Defesa Civil municipal', mede: 'alagamento', intervaloSeg: 600, situacao: 'ativa' },
  { id: 'BP-ENE', tipo: 'publica', nome: 'Concessionária de energia', mede: 'energia', intervaloSeg: 600, situacao: 'ativa' },
  { id: 'BP-AGU', tipo: 'publica', nome: 'Concessionária de água', mede: 'agua', intervaloSeg: 600, situacao: 'ativa' },
  { id: 'BP-TRA', tipo: 'publica', nome: 'Operadora de transporte', mede: 'transporte', intervaloSeg: 600, situacao: 'ativa' },
  { id: 'COM-APP', tipo: 'comunidade', nome: 'Registros da comunidade', mede: null, intervaloSeg: null, situacao: 'ativa' },
];

export const fontePorId = (id) => FONTES.find((f) => f.id === id);

const TODOS_OS_TIPOS = ['alagamento', 'calor', 'energia', 'agua', 'transporte'];

const local = (id, nome, bairroId) => {
  const b = bairroPorId(bairroId);
  return { id, nome, bairroId, lat: b.lat, lng: b.lng };
};

export const USUARIOS = {
  morador: {
    id: 'u-marina',
    perfil: 'morador',
    nome: 'Marina Souza',
    papel: 'Moradora',
    resumo: 'Recebe alertas da região e registra ocorrências.',
    email: 'marina.souza@exemplo.com',
    telefone: '(11) 9XXXX-4321',
    relatosConfirmados: 4,
    locais: [local('casa', 'Casa', 'jardim-helena'), local('trabalho', 'Trabalho', 'bras')],
    tipos: [...TODOS_OS_TIPOS],
    nivelMinimo: 'moderado',
    canais: { push: true, sms: true, email: false },
    consentimentos: { localizacao: true, notificacoes: true, analises: false },
  },
  agente: {
    id: 'u-carlos',
    perfil: 'agente',
    nome: 'Carlos Mendes',
    papel: 'Agente da Defesa Civil',
    resumo: 'Valida ocorrências e acompanha os alertas da cidade.',
    email: 'carlos.mendes@exemplo.com',
    telefone: '(11) 9XXXX-1188',
    relatosConfirmados: 0,
    locais: [local('base', 'Centro de operações', 'se')],
    tipos: [...TODOS_OS_TIPOS],
    nivelMinimo: 'alto',
    canais: { push: true, sms: false, email: true },
    consentimentos: { localizacao: true, notificacoes: true, analises: true },
  },
  operador: {
    id: 'u-renata',
    perfil: 'operador',
    nome: 'Renata Lima',
    papel: 'Operadora de serviço público',
    resumo: 'Acompanha e encerra interrupções de energia, água e transporte.',
    email: 'renata.lima@exemplo.com',
    telefone: '(11) 9XXXX-7702',
    relatosConfirmados: 0,
    locais: [local('centro-de-controle', 'Centro de controle', 'mooca')],
    tipos: ['energia', 'agua', 'transporte'],
    nivelMinimo: 'moderado',
    canais: { push: true, sms: false, email: true },
    consentimentos: { localizacao: true, notificacoes: true, analises: true },
  },
};

// ---------- Eventos ----------

function criarEventos(agora) {
  const min = (n) => agora - n * 60_000;
  const hora = (n) => agora - n * 3_600_000;

  const sensor = (fonteId, em, detalhe, extra = {}) => ({
    chave: fonteId, tipo: 'sensor', fonteId, nome: fontePorId(fonteId).nome, coletadoEm: em, detalhe, ...extra,
  });
  const publica = (fonteId, em, detalhe) => ({
    chave: fonteId, tipo: 'publica', fonteId, nome: fontePorId(fonteId).nome, coletadoEm: em, detalhe,
  });
  const comunidade = (autorId, autorNome, em, detalhe, extra = {}) => ({
    chave: autorId, tipo: 'comunidade', fonteId: 'COM-APP', nome: 'Registro comunitário', autorId, autorNome, coletadoEm: em, detalhe, ...extra,
  });
  const evento = (dados) => {
    const b = bairroPorId(dados.bairroId);
    return { lat: b.lat, lng: b.lng, exposicao: b.exposicao, validadoPorAgente: false, valor: null, ...dados };
  };
  const passo = (status, em, nota) => ({ status, em, nota });

  // Histórico resumido para eventos antigos, já encerrados ou descartados.
  const cicloEncerrado = (inicio, fim, origem, encerramento) => [
    passo(STATUS.reportado, inicio, `${origem} aceito pela ingestão.`),
    passo(STATUS.validacao, inicio, 'Dado válido e agrupado em evento.'),
    passo(STATUS.confirmado, inicio + 120_000, 'Evento confirmado.'),
    passo(STATUS.alerta, inicio + 150_000, 'Alerta emitido.'),
    passo(STATUS.monitoramento, inicio + 156_000, 'Notificações enviadas.'),
    passo(STATUS.encerrado, fim, encerramento),
  ];

  return [
    // --- Aguardando validação ---
    evento({
      id: 'EV-1045', tipo: 'calor', bairroId: 'lapa', titulo: 'Calor intenso na Lapa',
      descricao: 'A estação de temperatura registrou 39 °C, mas está com leituras atrasadas.',
      severidade: 3, valor: 39, status: STATUS.validacao, criadoEm: min(12), atualizadoEm: min(12),
      fontes: [sensor('S-TP-041', min(12), 'Temperatura do ar de 39 °C', { atrasado: true })],
      historico: [
        passo(STATUS.reportado, min(12), 'Leitura da Estação de temperatura da Lapa aceita pela ingestão.'),
        passo(STATUS.validacao, min(12), 'Dado válido. Confiança 60 (Média): aguardando um agente.'),
      ],
    }),
    evento({
      id: 'EV-1044', tipo: 'alagamento', bairroId: 'santana', titulo: 'Alagamento em Santana',
      descricao: 'Água na altura da roda dos carros em rua próxima à avenida principal.',
      severidade: 3, status: STATUS.validacao, criadoEm: min(18), atualizadoEm: min(18),
      fontes: [comunidade('u-paulo', 'Paulo H. Lima', min(18), 'Água na altura da roda dos carros. Enviei uma foto.', { foto: true })],
      historico: [
        passo(STATUS.reportado, min(18), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, min(18), 'Dado válido. Confiança 50 (Média): aguardando um agente.'),
      ],
    }),
    evento({
      id: 'EV-1043', tipo: 'energia', bairroId: 'bela-vista', titulo: 'Falta de energia na Bela Vista',
      descricao: 'Morador relata quarteirão sem energia há cerca de duas horas.',
      severidade: 2, valor: 2, status: STATUS.validacao, criadoEm: min(26), atualizadoEm: min(26),
      fontes: [comunidade('u-sandra', 'Sandra R. Dias', min(26), 'Quarteirão inteiro sem luz há umas duas horas.')],
      historico: [
        passo(STATUS.reportado, min(26), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, min(26), 'Dado válido. Confiança 40 (Baixa): aguardando um agente.'),
      ],
    }),

    // --- Ativos ---
    evento({
      id: 'EV-1041', tipo: 'alagamento', bairroId: 'vila-prudente', titulo: 'Alagamento na Vila Prudente',
      descricao: 'Viela alagada, com água na altura da roda dos carros. Confirmado por agente em contato com a subprefeitura.',
      severidade: 3, status: STATUS.monitoramento, validadoPorAgente: true, criadoEm: min(44), atualizadoEm: min(31),
      fontes: [comunidade('u-rita', 'Rita M. Santos', min(44), 'A viela encheu de água de novo, os carros não passam.')],
      historico: [
        passo(STATUS.reportado, min(44), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, min(44), 'Dado válido. Confiança 40 (Baixa): aguardando um agente.'),
        passo(STATUS.confirmado, min(31), 'Confirmado por Carlos Mendes (Agente da Defesa Civil). Subprefeitura confirmou por telefone.'),
        passo(STATUS.alerta, min(31), 'Risco Alto, prioridade P2. Alerta emitido.'),
        passo(STATUS.monitoramento, min(31), 'Notificações enviadas.'),
      ],
    }),
    evento({
      id: 'EV-1040', tipo: 'alagamento', bairroId: 'jardim-helena', titulo: 'Alagamento no Jardim Helena',
      descricao: 'O Córrego Itaim transbordou e a água cobre a rua ao lado da estação de trem.',
      severidade: 3, valor: 42, status: STATUS.monitoramento, criadoEm: min(52), atualizadoEm: min(4),
      fontes: [
        sensor('S-NA-014', min(4), 'Lâmina de água de 42 cm'),
        comunidade('u-marina', 'Marina Souza', min(47), 'Água na altura da roda dos carros em frente à estação.', { foto: true, relatorConfiavel: true }),
        comunidade('u-jose', 'José A. Ferreira', min(41), 'Rua intransitável, ônibus desviando.'),
      ],
      historico: [
        passo(STATUS.reportado, min(52), 'Leitura do Sensor de nível do Córrego Itaim aceita pela ingestão.'),
        passo(STATUS.validacao, min(52), 'Dado válido. Confiança 80 (Alta).'),
        passo(STATUS.confirmado, min(52), 'Confirmação automática: confiança de 75 ou mais.'),
        passo(STATUS.alerta, min(51), 'Risco Alto, prioridade P1. Alerta emitido.'),
        passo(STATUS.monitoramento, min(51), 'Notificações enviadas.'),
        passo(STATUS.alerta, min(30), 'Nova leitura: risco passou de Alto para Crítico. Alerta reemitido.'),
        passo(STATUS.monitoramento, min(30), 'Notificações enviadas.'),
      ],
    }),
    evento({
      id: 'EV-1039', tipo: 'energia', bairroId: 'mooca', titulo: 'Falta de energia na Mooca',
      descricao: 'A concessionária informa interrupção em parte do bairro, com retorno previsto em 3 horas.',
      severidade: 2, valor: 3, status: STATUS.monitoramento, criadoEm: min(70), atualizadoEm: min(8),
      fontes: [publica('BP-ENE', min(8), 'Interrupção com duração prevista de 3 h')],
      historico: [
        passo(STATUS.reportado, min(70), 'Aviso da Concessionária de energia aceito pela ingestão.'),
        passo(STATUS.validacao, min(70), 'Dado válido. Confiança 90 (Alta).'),
        passo(STATUS.confirmado, min(70), 'Confirmação automática: confiança de 75 ou mais.'),
        passo(STATUS.alerta, min(69), 'Risco Moderado, prioridade P2. Alerta emitido.'),
        passo(STATUS.monitoramento, min(69), 'Notificações enviadas.'),
      ],
    }),
    evento({
      id: 'EV-1037', tipo: 'calor', bairroId: 'se', titulo: 'Calor muito forte na Sé',
      descricao: 'Temperatura de 36 °C no centro, com aviso de onda de calor para a tarde.',
      severidade: 2, valor: 36, status: STATUS.monitoramento, criadoEm: min(95), atualizadoEm: min(1),
      fontes: [
        publica('BP-MET', min(6), 'Aviso de onda de calor para a região central'),
        sensor('S-TP-032', min(1), 'Temperatura do ar de 36 °C'),
      ],
      historico: [
        passo(STATUS.reportado, min(95), 'Leitura da Estação de temperatura da Sé aceita pela ingestão.'),
        passo(STATUS.validacao, min(95), 'Dado válido. Confiança 80 (Alta).'),
        passo(STATUS.confirmado, min(95), 'Confirmação automática: confiança de 75 ou mais.'),
        passo(STATUS.alerta, min(94), 'Risco Alto, prioridade P1. Alerta emitido.'),
        passo(STATUS.monitoramento, min(94), 'Notificações enviadas.'),
      ],
    }),
    evento({
      id: 'EV-1035', tipo: 'agua', bairroId: 'sao-miguel', titulo: 'Falta de água em São Miguel Paulista',
      descricao: 'Moradores relatam torneiras secas desde o início da tarde. Confirmado por agente.',
      severidade: 2, valor: 3, status: STATUS.monitoramento, validadoPorAgente: true, criadoEm: min(150), atualizadoEm: min(128),
      fontes: [comunidade('u-luis', 'Luís F. Costa', min(150), 'Sem água em casa desde o começo da tarde.')],
      historico: [
        passo(STATUS.reportado, min(150), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, min(150), 'Dado válido. Confiança 40 (Baixa): aguardando um agente.'),
        passo(STATUS.confirmado, min(128), 'Confirmado por Carlos Mendes (Agente da Defesa Civil). Concessionária confirmou manutenção na rede.'),
        passo(STATUS.alerta, min(128), 'Risco Moderado, prioridade P3. Alerta emitido.'),
        passo(STATUS.monitoramento, min(128), 'Notificações enviadas.'),
      ],
    }),
    evento({
      id: 'EV-1033', tipo: 'calor', bairroId: 'pinheiros', titulo: 'Calor forte em Pinheiros',
      descricao: 'Temperatura de 33 °C informada pela base de meteorologia.',
      severidade: 1, valor: 33, status: STATUS.monitoramento, criadoEm: min(180), atualizadoEm: min(9),
      fontes: [publica('BP-MET', min(9), 'Temperatura do ar de 33 °C')],
      historico: [
        passo(STATUS.reportado, min(180), 'Dado da Base de meteorologia aceito pela ingestão.'),
        passo(STATUS.validacao, min(180), 'Dado válido. Confiança 90 (Alta).'),
        passo(STATUS.confirmado, min(180), 'Confirmação automática: confiança de 75 ou mais.'),
        passo(STATUS.monitoramento, min(180), 'Prioridade P4: evento exibido apenas no painel, sem notificação.'),
      ],
    }),

    // --- Encerrados e descartados ---
    evento({
      id: 'EV-1030', tipo: 'agua', bairroId: 'pinheiros', titulo: 'Falta de água em Pinheiros',
      descricao: 'Manutenção emergencial na rede, já concluída.',
      severidade: 2, valor: 4, status: STATUS.encerrado, criadoEm: hora(9), atualizadoEm: hora(5),
      fontes: [publica('BP-AGU', hora(5), 'Abastecimento normalizado')],
      historico: cicloEncerrado(hora(9), hora(5), 'Aviso da Concessionária de água', 'Encerrado por Renata Lima (Operadora de serviço público). Abastecimento normalizado.'),
    }),
    evento({
      id: 'EV-1029', tipo: 'alagamento', bairroId: 'parque-do-carmo', titulo: 'Alagamento no Parque do Carmo',
      descricao: 'Relato único de poça em via interna do parque.',
      severidade: 1, status: STATUS.descartado, criadoEm: hora(11), atualizadoEm: hora(9),
      fontes: [comunidade('u-bruno', 'Bruno T. Alves', hora(11), 'Poça grande na pista de caminhada.')],
      historico: [
        passo(STATUS.reportado, hora(11), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, hora(11), 'Dado válido. Confiança 40 (Baixa): aguardando um agente.'),
        passo(STATUS.descartado, hora(9), 'Descartado automaticamente: 2 h sem validação e sem nova fonte.'),
      ],
    }),
    evento({
      id: 'EV-1027', tipo: 'calor', bairroId: 'se', titulo: 'Calor muito forte na Sé',
      descricao: 'Temperatura de 35 °C registrada no centro.',
      severidade: 2, valor: 35, status: STATUS.encerrado, criadoEm: hora(26), atualizadoEm: hora(21),
      fontes: [sensor('S-TP-032', hora(21), 'Temperatura do ar de 29 °C')],
      historico: cicloEncerrado(hora(26), hora(21), 'Leitura da Estação de temperatura da Sé', 'Encerrado automaticamente: 60 min de leituras normais.'),
    }),
    evento({
      id: 'EV-1026', tipo: 'alagamento', bairroId: 'butanta', titulo: 'Alagamento no Butantã',
      descricao: 'Transbordamento do Córrego Pirajuçara após chuva forte.',
      severidade: 3, valor: 38, status: STATUS.encerrado, criadoEm: hora(30), atualizadoEm: hora(26),
      fontes: [
        sensor('S-NA-009', hora(26), 'Lâmina de água de 2 cm'),
        publica('BP-DC', hora(29), 'Aviso de transbordamento do córrego'),
      ],
      historico: cicloEncerrado(hora(30), hora(26), 'Leitura do Sensor de nível do Córrego Pirajuçara', 'Encerrado automaticamente: 60 min de leituras normais.'),
    }),
    evento({
      id: 'EV-1025', tipo: 'transporte', bairroId: 'bras', titulo: 'Transporte interrompido no Brás',
      descricao: 'Circulação de trens interrompida por falha de energia na via.',
      severidade: 2, valor: 2, status: STATUS.encerrado, criadoEm: hora(34), atualizadoEm: hora(31),
      fontes: [publica('BP-TRA', hora(31), 'Circulação normalizada')],
      historico: cicloEncerrado(hora(34), hora(31), 'Aviso da Operadora de transporte', 'Encerrado por Renata Lima (Operadora de serviço público). Circulação normalizada.'),
    }),
    evento({
      id: 'EV-1024', tipo: 'energia', bairroId: 'santana', titulo: 'Falta de energia em Santana',
      descricao: 'Queda de energia após temporal, confirmada por agente.',
      severidade: 3, valor: 6, status: STATUS.encerrado, validadoPorAgente: true, criadoEm: hora(50), atualizadoEm: hora(43),
      fontes: [comunidade('u-paulo', 'Paulo H. Lima', hora(50), 'Bairro sem luz desde o temporal.', { foto: true })],
      historico: cicloEncerrado(hora(50), hora(43), 'Registro comunitário', 'Encerrado por Renata Lima (Operadora de serviço público). Energia restabelecida.'),
    }),
    evento({
      id: 'EV-1023', tipo: 'alagamento', bairroId: 'mooca', titulo: 'Alagamento na Mooca',
      descricao: 'Relato repetido de evento que já estava encerrado.',
      severidade: 2, status: STATUS.descartado, criadoEm: hora(72), atualizadoEm: hora(71),
      fontes: [comunidade('u-rita', 'Rita M. Santos', hora(72), 'Rua alagada perto do viaduto.')],
      historico: [
        passo(STATUS.reportado, hora(72), 'Registro comunitário aceito pela ingestão.'),
        passo(STATUS.validacao, hora(72), 'Dado válido. Confiança 40 (Baixa): aguardando um agente.'),
        passo(STATUS.descartado, hora(71), 'Descartado por Carlos Mendes (Agente da Defesa Civil). Motivo: relato duplicado de evento já encerrado.'),
      ],
    }),
    evento({
      id: 'EV-1022', tipo: 'agua', bairroId: 'jardim-helena', titulo: 'Falta de água no Jardim Helena',
      descricao: 'Interrupção programada para reparo na rede.',
      severidade: 3, valor: 8, status: STATUS.encerrado, criadoEm: hora(98), atualizadoEm: hora(90),
      fontes: [publica('BP-AGU', hora(90), 'Abastecimento normalizado')],
      historico: cicloEncerrado(hora(98), hora(90), 'Aviso da Concessionária de água', 'Encerrado por Renata Lima (Operadora de serviço público). Abastecimento normalizado.'),
    }),
    evento({
      id: 'EV-1021', tipo: 'alagamento', bairroId: 'jardim-helena', titulo: 'Alagamento no Jardim Helena',
      descricao: 'Córrego Itaim acima do nível após chuva de fim de tarde.',
      severidade: 2, valor: 24, status: STATUS.encerrado, criadoEm: hora(146), atualizadoEm: hora(142),
      fontes: [
        sensor('S-NA-014', hora(142), 'Lâmina de água de 3 cm'),
        comunidade('u-marina', 'Marina Souza', hora(145), 'Água cobrindo o meio-fio na minha rua.', { relatorConfiavel: true }),
      ],
      historico: cicloEncerrado(hora(146), hora(142), 'Leitura do Sensor de nível do Córrego Itaim', 'Encerrado automaticamente: 60 min de leituras normais.'),
    }),
  ];
}

// ---------- Notificações ----------

function criarNotificacoes(agora) {
  const min = (n) => agora - n * 60_000;
  const hora = (n) => agora - n * 3_600_000;
  let n = 1;
  const aviso = (perfil, eventoId, tipo, titulo, texto, canais, em, lida) => ({
    id: `N-${n++}`, perfil, eventoId, tipo, titulo, texto, canais, em, lida,
  });
  return [
    aviso('agente', 'EV-1045', 'validacao', 'Novo evento na fila de validação', 'Calor intenso na Lapa. Prioridade P2, confiança 60 (Média).', ['central'], min(12), false),
    aviso('agente', 'EV-1044', 'validacao', 'Novo evento na fila de validação', 'Alagamento em Santana. Prioridade P2, confiança 50 (Média).', ['central'], min(18), false),
    aviso('agente', 'EV-1043', 'validacao', 'Novo evento na fila de validação', 'Falta de energia na Bela Vista. Prioridade P3, confiança 40 (Baixa).', ['central'], min(26), false),
    aviso('operador', 'EV-1043', 'validacao', 'Novo evento na fila de validação', 'Falta de energia na Bela Vista. Prioridade P3, confiança 40 (Baixa).', ['central'], min(26), false),
    aviso('morador', 'EV-1040', 'atualizacao', 'Alerta atualizado: risco Crítico', 'Alagamento no Jardim Helena passou de Alto para Crítico. Fica a 0,1 km de Casa.', ['push', 'sms'], min(30), false),
    aviso('agente', 'EV-1040', 'atualizacao', 'Alerta P1 atualizado', 'Alagamento no Jardim Helena passou de Alto para Crítico.', ['central'], min(30), true),
    aviso('morador', 'EV-1040', 'ocorrencia', 'Seu registro reforçou um alerta', 'Sua ocorrência foi agrupada ao evento EV-1040 e aumentou a confiança do alerta.', ['central'], min(47), true),
    aviso('morador', 'EV-1040', 'alerta', 'Alerta de risco Alto', 'Alagamento no Jardim Helena. Fica a 0,1 km de Casa. Confiança 80 (Alta).', ['push', 'sms'], min(51), true),
    aviso('morador', 'EV-1039', 'alerta', 'Alerta de risco Moderado', 'Falta de energia na Mooca. Fica a 1,8 km de Trabalho. Confiança 90 (Alta).', ['push'], min(69), true),
    aviso('morador', 'EV-1037', 'alerta', 'Alerta de risco Alto', 'Calor muito forte na Sé. Fica a 1,4 km de Trabalho. Confiança 80 (Alta).', ['push', 'sms'], min(94), false),
    aviso('agente', 'EV-1037', 'alerta', 'Alerta P1 emitido', 'Calor muito forte na Sé. Risco Alto, confiança 80 (Alta).', ['central'], min(94), true),
    aviso('morador', 'EV-1035', 'alerta', 'Alerta de risco Moderado', 'Falta de água em São Miguel Paulista. Fica a 1,4 km de Casa. Confiança 70 (Média).', ['central'], min(128), true),
    aviso('morador', 'EV-1022', 'encerramento', 'Evento encerrado', 'Falta de água no Jardim Helena foi encerrada. Abastecimento normalizado.', ['central'], hora(90), true),
    aviso('operador', 'EV-1024', 'validacao', 'Novo evento na fila de validação', 'Falta de energia em Santana. Prioridade P2, confiança 50 (Média).', ['central'], hora(50), true),
  ];
}

export function criarEstadoInicial(agora = Date.now()) {
  return {
    versao: VERSAO,
    criadoEm: agora,
    perfil: null,
    contaExcluida: false,
    usuarios: structuredClone(USUARIOS),
    eventos: criarEventos(agora),
    notificacoes: criarNotificacoes(agora),
    auditoria: [
      { em: agora - 145 * 3_600_000, texto: 'Carlos Mendes (Agente da Defesa Civil) consultou a identificação do autor para validar a ocorrência EV-1021.' },
    ],
    proximoEvento: 1046,
    proximaNotificacao: 100,
  };
}
