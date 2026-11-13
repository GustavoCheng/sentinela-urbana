import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TriangleAlert, Bell, CirclePlus, ClipboardList, ClipboardCheck, Radio, ChartColumn,
  SlidersHorizontal, Lock, LogOut, Menu, ShieldCheck, CircleCheck,
} from 'lucide-react';
import { useApp, emValidacao, resumoFontes, visivelNaFila } from '../store.jsx';
import { tempoRelativo } from './ui.jsx';

const ITENS = {
  painel: { para: '/painel', rotulo: 'Painel', icone: LayoutDashboard },
  alertas: { para: '/alertas', rotulo: 'Alertas', icone: TriangleAlert },
  notificacoes: { para: '/notificacoes', rotulo: 'Notificações', icone: Bell },
  registrar: { para: '/registrar', rotulo: 'Registrar ocorrência', icone: CirclePlus },
  ocorrencias: { para: '/ocorrencias', rotulo: 'Minhas ocorrências', icone: ClipboardList },
  validacao: { para: '/validacao', rotulo: 'Fila de validação', icone: ClipboardCheck },
  fontes: { para: '/fontes', rotulo: 'Fontes de dados', icone: Radio },
  analises: { para: '/analises', rotulo: 'Análises', icone: ChartColumn },
  preferencias: { para: '/preferencias', rotulo: 'Preferências', icone: SlidersHorizontal },
  privacidade: { para: '/privacidade', rotulo: 'Privacidade', icone: Lock },
};

const MENU = {
  morador: [
    ['Acompanhar', ['painel', 'alertas', 'notificacoes']],
    ['Participar', ['registrar', 'ocorrencias']],
    ['Conta', ['preferencias', 'privacidade']],
  ],
  equipe: [
    ['Acompanhar', ['painel', 'alertas', 'notificacoes']],
    ['Operação', ['validacao', 'fontes', 'analises']],
    ['Conta', ['preferencias', 'privacidade']],
  ],
};

const TITULOS = [
  ['/alertas/', 'Detalhe do alerta'],
  ['/painel', 'Painel de acompanhamento'],
  ['/alertas', 'Alertas'],
  ['/notificacoes', 'Central de notificações'],
  ['/registrar', 'Registrar ocorrência'],
  ['/ocorrencias', 'Minhas ocorrências'],
  ['/validacao', 'Fila de validação'],
  ['/fontes', 'Fontes de dados'],
  ['/analises', 'Análises'],
  ['/preferencias', 'Preferências'],
  ['/privacidade', 'Privacidade e dados pessoais'],
];

const iniciais = (nome) => nome.split(' ').map((p) => p[0]).slice(0, 2).join('');

export default function Layout() {
  const { usuario, perfil, equipe, eventos, naoLidas, agora, aviso, acoes } = useApp();
  const [aberto, setAberto] = useState(false);
  const local = useLocation();
  const navegar = useNavigate();

  useEffect(() => { setAberto(false); window.scrollTo(0, 0); }, [local.pathname]);

  const caminho = local.pathname;
  const titulo = caminho.endsWith('/origem')
    ? 'Origem e confiança do dado'
    : (TITULOS.find(([prefixo]) => caminho.startsWith(prefixo)) || [null, 'Sentinela Urbana'])[1];
  const fila = equipe ? eventos.filter((e) => emValidacao(e) && visivelNaFila(e, perfil)).length : 0;
  const contagem = { notificacoes: naoLidas, validacao: fila };
  const fontes = resumoFontes(agora);

  return (
    <div className="app">
      <div className={`overlay ${aberto ? 'open' : ''}`} onClick={() => setAberto(false)} />
      <aside className={`sidebar ${aberto ? 'open' : ''}`}>
        <Link to="/painel" className="brand">
          <span className="brand-mark"><ShieldCheck size={20} aria-hidden="true" /></span>
          <span>
            <span className="brand-name">Sentinela Urbana</span>
            <br />
            <span className="brand-sub">Riscos urbanos em tempo real</span>
          </span>
        </Link>

        {MENU[equipe ? 'equipe' : 'morador'].map(([secao, chaves]) => (
          <nav key={secao} aria-label={secao}>
            <div className="nav-section">{secao}</div>
            <div className="nav">
              {chaves.map((chave) => {
                const item = ITENS[chave];
                const Icone = item.icone;
                return (
                  <NavLink key={chave} to={item.para}>
                    <Icone size={18} aria-hidden="true" />
                    {item.rotulo}
                    {contagem[chave] ? <span className="count">{contagem[chave]}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        ))}

        <div className="user-card">
          <div className="row">
            <span className="avatar">{iniciais(usuario.nome)}</span>
            <div className="grow">
              <div className="user-name">{usuario.nome}</div>
              <div className="user-role">{usuario.papel}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-block"
            onClick={() => { acoes.sair(); navegar('/'); }}
          >
            <LogOut size={15} aria-hidden="true" /> Sair ou trocar de perfil
          </button>
        </div>
        <p className="demo-note">Protótipo acadêmico com dados simulados.</p>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="bell menu-btn" onClick={() => setAberto(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <h1>{titulo}</h1>
          <div className="fresh" title={`${fontes.ativas} de ${fontes.total} fontes ativas`}>
            <span className="dot" />
            <span className="txt">
              Dados atualizados {tempoRelativo(fontes.maisRecente, agora)} · {fontes.ativas} de {fontes.total} fontes ativas
            </span>
          </div>
          <Link to="/notificacoes" className="bell" aria-label={`Notificações: ${naoLidas} não lidas`}>
            <Bell size={19} />
            {naoLidas ? <span className="count">{naoLidas}</span> : null}
          </Link>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      {aviso ? (
        <div className="toast" role="status" key={aviso.id}>
          <CircleCheck size={18} aria-hidden="true" />
          {aviso.texto}
        </div>
      ) : null}
    </div>
  );
}
