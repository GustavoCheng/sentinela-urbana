import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { criarEstadoInicial, bairroPorId, FONTES, VERSAO } from './data/seed.js';
import { avaliar, STATUS, STATUS_ATIVOS, TIPOS_SERVICO } from './domain/regras.js';
import { receberDado, validarEvento, encerrarEvento, transicoesAutomaticas } from './domain/pipeline.js';
import { ultimaAtualizacao } from './domain/fontes.js';

const CHAVE = 'sentinela-urbana:estado';
const VALIDADE = 6 * 3_600_000; // depois de 6 h a demonstração volta ao início

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && salvo.versao === VERSAO && Date.now() - salvo.criadoEm < VALIDADE) return salvo;
  } catch {
    // sem armazenamento local: segue com os dados iniciais
  }
  return criarEstadoInicial();
}

function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // armazenamento indisponível: o protótipo funciona sem persistir
  }
}

const Contexto = createContext(null);

export function Provedor({ children }) {
  const [estado, setEstado] = useState(carregar);
  const [agora, setAgora] = useState(() => Date.now());
  const [aviso, setAviso] = useState(null);
  const ref = useRef(estado);

  const gravar = useCallback((novo) => {
    ref.current = novo;
    setEstado(novo);
    salvar(novo);
  }, []);

  const alterar = useCallback(
    (fn) => gravar(fn(structuredClone(ref.current)) || ref.current),
    [gravar],
  );

  const executar = useCallback(
    (fn) => {
      const { estado: novo, resultado } = fn(ref.current, Date.now());
      if (novo !== ref.current) gravar(novo);
      setAgora(Date.now());
      return resultado;
    },
    [gravar],
  );

  // Relógio do protótipo: atualiza os tempos relativos e as transições automáticas.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const novo = transicoesAutomaticas(ref.current, t);
      if (novo !== ref.current) gravar(novo);
      setAgora(t);
    }, 2_000);
    return () => clearInterval(id);
  }, [gravar]);

  const avisar = useCallback((texto) => {
    setAviso({ texto, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!aviso) return undefined;
    const id = setTimeout(() => setAviso(null), 4_000);
    return () => clearTimeout(id);
  }, [aviso]);

  const acoes = useMemo(
    () => ({
      entrar: (perfil) => alterar((s) => { s.perfil = perfil; return s; }),
      sair: () => alterar((s) => { s.perfil = null; return s; }),
      reiniciar: () => gravar(criarEstadoInicial()),
      registrarOcorrencia: (dados) =>
        executar((s, t) => receberDado(s, { origem: 'comunidade', autor: s.usuarios.morador, ...dados }, t)),
      simularLeitura: (fonteId, valor) =>
        executar((s, t) => receberDado(s, { origem: 'sensor', fonteId, valor }, t)),
      validar: (eventoId, decisao, justificativa) =>
        executar((s, t) => validarEvento(s, eventoId, decisao, s.usuarios[s.perfil], justificativa, t)),
      encerrar: (eventoId, justificativa) =>
        executar((s, t) => encerrarEvento(s, eventoId, s.usuarios[s.perfil], justificativa, t)),
      marcarLida: (id) =>
        alterar((s) => {
          const n = s.notificacoes.find((x) => x.id === id);
          if (n) n.lida = true;
          return s;
        }),
      marcarTodasLidas: () =>
        alterar((s) => {
          s.notificacoes.forEach((n) => { if (n.perfil === s.perfil) n.lida = true; });
          return s;
        }),
      salvarPreferencias: (dados) =>
        alterar((s) => { Object.assign(s.usuarios[s.perfil], dados); return s; }),
      salvarConsentimentos: (consentimentos) =>
        alterar((s) => {
          const perfil = s.perfil;
          s.usuarios[perfil].consentimentos = consentimentos;
          s.auditoria.unshift({ em: Date.now(), texto: `${s.usuarios[perfil].nome} alterou os próprios consentimentos.` });
          return s;
        }),
      excluirConta: () =>
        alterar((s) => {
          // Remove dados pessoais do titular e anonimiza os relatos já enviados.
          const usuario = s.usuarios[s.perfil];
          s.eventos.forEach((e) =>
            e.fontes.forEach((f) => {
              if (f.autorId === usuario.id) { f.autorId = null; f.autorNome = 'Autor removido a pedido do titular'; }
            }),
          );
          s.notificacoes = s.notificacoes.filter((n) => n.perfil !== s.perfil);
          s.contaExcluida = s.perfil === 'morador' ? true : s.contaExcluida;
          s.perfil = null;
          return s;
        }),
      avisar,
    }),
    [alterar, executar, gravar, avisar],
  );

  // Recalculados só quando o estado muda, não a cada batida do relógio.
  const eventos = useMemo(
    () => estado.eventos.map((e) => ({ ...e, ...avaliar(e), bairro: bairroPorId(e.bairroId) })),
    [estado.eventos],
  );
  const notificacoes = useMemo(
    () => estado.notificacoes.filter((n) => n.perfil === estado.perfil),
    [estado.notificacoes, estado.perfil],
  );

  const valor = useMemo(() => {
    const perfil = estado.perfil;
    const usuario = perfil ? estado.usuarios[perfil] : null;
    return {
      estado,
      agora,
      perfil,
      usuario,
      equipe: perfil === 'agente' || perfil === 'operador',
      eventos,
      notificacoes,
      naoLidas: notificacoes.filter((n) => !n.lida).length,
      aviso,
      acoes,
    };
  }, [estado, agora, aviso, acoes, eventos, notificacoes]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp() {
  return useContext(Contexto);
}

// ---------- Seletores usados em mais de uma tela ----------

const ORDEM_PRIORIDADE = { P1: 1, P2: 2, P3: 3, P4: 4 };

// RN05: P1 primeiro; no empate, o maior risco e depois o evento mais recente.
export function porPrioridade(a, b) {
  return (
    ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade] ||
    b.risco.produto - a.risco.produto ||
    b.atualizadoEm - a.atualizadoEm
  );
}

export const ehAtivo = (e) => STATUS_ATIVOS.includes(e.status);
export const emValidacao = (e) => e.status === STATUS.validacao;

// O operador só trata interrupções de serviços essenciais.
export function visivelNaFila(evento, perfil) {
  return perfil === 'agente' || TIPOS_SERVICO.includes(evento.tipo);
}

export function resumoFontes(agora) {
  const ativas = FONTES.filter((f) => f.situacao === 'ativa');
  const maisRecente = Math.max(...ativas.map((f) => ultimaAtualizacao(f, agora) || 0));
  return { total: FONTES.length, ativas: ativas.length, maisRecente };
}
