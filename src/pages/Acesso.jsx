import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Layers, Gauge, BellRing, Check, ArrowRight, RotateCcw, Info } from 'lucide-react';
import { useApp } from '../store.jsx';

const ORDEM = ['morador', 'agente', 'operador'];
const iniciais = (nome) => nome.split(' ').map((p) => p[0]).slice(0, 2).join('');

// Tela 1: Acesso (RF18). A escolha do perfil define o menu e as permissões.
export default function Acesso() {
  const { estado, acoes } = useApp();
  const [perfil, setPerfil] = useState(estado.contaExcluida ? 'agente' : 'morador');
  const navegar = useNavigate();
  const escolhido = estado.usuarios[perfil];

  const entrar = (e) => {
    e.preventDefault();
    acoes.entrar(perfil);
    navegar('/painel');
  };

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark"><ShieldCheck size={20} aria-hidden="true" /></span>
          <span className="brand-name" style={{ fontSize: '1.1rem' }}>Sentinela Urbana</span>
        </div>
        <h1>Saiba do risco antes de sair de casa.</h1>
        <p className="lead">
          Alagamentos, calor extremo e falta de energia, água ou transporte em um só lugar, com a origem e a
          confiança de cada dado.
        </p>
        <ul className="login-points">
          <li>
            <span className="ic"><Layers size={18} aria-hidden="true" /></span>
            <span><strong>Três fontes integradas</strong>Sensores, bases públicas e relatos da comunidade.</span>
          </li>
          <li>
            <span className="ic"><Gauge size={18} aria-hidden="true" /></span>
            <span><strong>Confiança visível</strong>Cada alerta mostra de onde veio o dado e quanto ele é confiável.</span>
          </li>
          <li>
            <span className="ic"><BellRing size={18} aria-hidden="true" /></span>
            <span><strong>Alertas por prioridade</strong>O que é mais grave e mais confiável chega primeiro.</span>
          </li>
        </ul>
      </section>

      <section className="login-panel">
        <form className="login-box" onSubmit={entrar}>
          <div>
            <h1>Entrar</h1>
            <p className="muted">Escolha um perfil para acessar a demonstração.</p>
          </div>

          <div className="stack-sm" role="radiogroup" aria-label="Perfil de acesso">
            {ORDEM.map((chave) => {
              const u = estado.usuarios[chave];
              const bloqueado = chave === 'morador' && estado.contaExcluida;
              return (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={perfil === chave}
                  className="profile"
                  disabled={bloqueado}
                  onClick={() => setPerfil(chave)}
                >
                  <span className="avatar">{iniciais(u.nome)}</span>
                  <span>
                    <span className="strong">{u.nome}</span>
                    <span className="small muted" style={{ display: 'block' }}>{u.papel}</span>
                    <span className="small" style={{ display: 'block' }}>
                      {bloqueado ? 'Conta excluída nesta demonstração.' : u.resumo}
                    </span>
                  </span>
                  <Check size={20} className="check" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Entrar como {escolhido.nome.split(' ')[0]} <ArrowRight size={17} aria-hidden="true" />
          </button>

          <div className="note">
            <Info size={17} aria-hidden="true" />
            <span>
              Acesso de demonstração, sem senha. No sistema real, agentes e operadores entram com autenticação em
              dois fatores.
            </span>
          </div>

          <div className="row between small muted">
            <span>Protótipo acadêmico com dados simulados.</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { acoes.reiniciar(); setPerfil('morador'); }}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reiniciar dados
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
