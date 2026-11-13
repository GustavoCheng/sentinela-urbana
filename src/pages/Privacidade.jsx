import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, History, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Alternador, Modal, dataHora } from '../components/ui.jsx';

// Tela 13: Privacidade e dados pessoais (RF19, RNF09 e RNF10).
export default function Privacidade() {
  const { usuario, estado, eventos, notificacoes, equipe, acoes } = useApp();
  const [excluindo, setExcluindo] = useState(false);
  const navegar = useNavigate();
  const c = usuario.consentimentos;

  const mudar = (chave, valor) => {
    acoes.salvarConsentimentos({ ...c, [chave]: valor });
    acoes.avisar(valor ? 'Consentimento registrado.' : 'Consentimento revogado.');
  };

  const relatos = eventos.flatMap((e) =>
    e.fontes.filter((f) => f.autorId === usuario.id).map((f) => ({ evento: e.id, titulo: e.titulo, enviadoEm: new Date(f.coletadoEm).toISOString(), texto: f.detalhe, foto: Boolean(f.foto) })),
  );

  const exportar = () => {
    const dados = {
      geradoEm: new Date().toISOString(),
      titular: { nome: usuario.nome, email: usuario.email, telefone: usuario.telefone, perfil: usuario.papel },
      locaisDeInteresse: usuario.locais.map((l) => ({ nome: l.nome, bairro: l.bairroId })),
      preferencias: { tipos: usuario.tipos, nivelMinimo: usuario.nivelMinimo, canais: usuario.canais },
      consentimentos: usuario.consentimentos,
      relatos,
      notificacoes: notificacoes.map((n) => ({ titulo: n.titulo, texto: n.texto, canais: n.canais, em: new Date(n.em).toISOString() })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meus-dados-sentinela-urbana.json';
    link.click();
    URL.revokeObjectURL(url);
    acoes.avisar('Arquivo com os seus dados gerado.');
  };

  const excluir = () => {
    acoes.excluirConta();
    navegar('/');
  };

  return (
    <>
      <p className="page-intro">
        Você decide como os seus dados são usados, conforme a LGPD. Pedidos de acesso e de exclusão são atendidos em
        até 15 dias.
      </p>

      <div className="grid-half">
        <section className="card">
          <h2 style={{ marginBottom: 4 }}>Consentimentos</h2>
          <Alternador
            marcado={c.localizacao}
            aoMudar={(v) => mudar('localizacao', v)}
            titulo="Usar meus locais de interesse"
            descricao="Necessário para selecionar os alertas da sua região."
          />
          <Alternador
            marcado={c.notificacoes}
            aoMudar={(v) => mudar('notificacoes', v)}
            titulo="Receber notificações"
            descricao="Sem este consentimento, nenhum alerta é enviado a você."
          />
          <Alternador
            marcado={c.analises}
            aoMudar={(v) => mudar('analises', v)}
            titulo="Uso em estatísticas"
            descricao="Permite usar seus registros, sem identificação, nos indicadores da plataforma."
          />
        </section>

        <section className="card stack">
          <h2>Seus direitos</h2>
          <div className="row">
            <div className="grow">
              <div className="strong">Exportar meus dados</div>
              <div className="small muted">Baixa um arquivo com cadastro, preferências, relatos e notificações.</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={exportar}>
              <Download size={16} aria-hidden="true" /> Exportar
            </button>
          </div>
          <div className="row">
            <div className="grow">
              <div className="strong">Excluir minha conta</div>
              <div className="small muted">Apaga seus dados pessoais. Os relatos enviados ficam sem autoria.</div>
            </div>
            <button type="button" className="btn btn-danger" onClick={() => setExcluindo(true)}>
              <Trash2 size={16} aria-hidden="true" /> Excluir
            </button>
          </div>
        </section>
      </div>

      <section className="card card-flush">
        <div className="card-head" style={{ paddingBottom: 12, marginBottom: 0 }}>
          <h2>Dados que guardamos sobre você</h2>
          <span className="chip chip-ok"><ShieldCheck size={13} aria-hidden="true" /> Cifrados em repouso</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Dado</th><th>Valor</th><th>Para que serve</th><th>Quem vê</th></tr></thead>
            <tbody>
              <tr><td className="strong">Nome</td><td>{usuario.nome}</td><td>Identificar a conta</td><td>Você{equipe ? '' : ' e a equipe de validação, ao analisar um relato seu'}</td></tr>
              <tr><td className="strong">E-mail e telefone</td><td>{usuario.email} · {usuario.telefone}</td><td>Enviar alertas por SMS e e-mail</td><td>Só você</td></tr>
              <tr><td className="strong">Locais de interesse</td><td>{usuario.locais.map((l) => l.nome).join(', ') || 'Nenhum'}</td><td>Selecionar alertas da sua região</td><td>Só você</td></tr>
              <tr><td className="strong">Relatos enviados</td><td>{relatos.length}</td><td>Validar ocorrências e calcular a confiança</td><td>Público, como "Morador da região"</td></tr>
              <tr><td className="strong">Notificações</td><td>{notificacoes.length}</td><td>Histórico da central</td><td>Só você</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack">
        <div className="row"><History size={18} aria-hidden="true" /><h2>Trilha de auditoria</h2></div>
        <p className="small muted">Cada consulta ou alteração de dado pessoal fica registrada com autor, data e hora.</p>
        {estado.auditoria.length === 0 ? (
          <p className="muted">Nenhum acesso registrado.</p>
        ) : (
          <ul className="stack-sm">
            {estado.auditoria.slice(0, 8).map((a) => (
              <li key={`${a.em}-${a.texto}`} className="row" style={{ alignItems: 'flex-start' }}>
                <span className="tiny muted nowrap" style={{ minWidth: 92 }}>{dataHora(a.em)}</span>
                <span className="small">{a.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {excluindo ? (
        <Modal
          titulo="Excluir minha conta"
          aoFechar={() => setExcluindo(false)}
          rodape={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setExcluindo(false)}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={excluir}>Excluir conta e dados</button>
            </>
          )}
        >
          <p>
            Seus dados pessoais, locais, preferências e notificações serão apagados. Os {relatos.length} relatos já
            enviados continuam nos eventos, sem a sua identificação.
          </p>
          <p className="small muted">
            Nesta demonstração, use "Reiniciar dados" na tela de acesso para restaurar a conta.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
