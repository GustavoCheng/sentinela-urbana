import { useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { useApp, ehAtivo, emValidacao, porPrioridade } from '../store.jsx';
import { LinhaAlerta, Vazio } from '../components/ui.jsx';
import { NIVEIS, ROTULO_NIVEL, STATUS, TIPOS } from '../domain/regras.js';

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Tela 3: Alertas (RF06 e RF08). A ordem segue a prioridade P1 a P4 (RN05).
export default function Alertas() {
  const { eventos, equipe, agora } = useApp();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [nivel, setNivel] = useState('todos');
  const [situacao, setSituacao] = useState('ativos');

  const lista = useMemo(() => {
    const termo = semAcento(busca.trim());
    return eventos
      .filter((e) => {
        // O morador só vê eventos já confirmados; a fila é restrita à equipe.
        if (!equipe && (emValidacao(e) || e.status === STATUS.descartado)) return false;
        if (situacao === 'ativos' && !ehAtivo(e)) return false;
        if (situacao === 'validacao' && !emValidacao(e)) return false;
        if (situacao === 'encerrados' && e.status !== STATUS.encerrado && e.status !== STATUS.descartado) return false;
        if (tipo !== 'todos' && e.tipo !== tipo) return false;
        if (nivel !== 'todos' && e.risco.nivel !== nivel) return false;
        if (termo && !semAcento(`${e.titulo} ${e.bairro.nome} ${e.id}`).includes(termo)) return false;
        return true;
      })
      .sort(porPrioridade);
  }, [eventos, equipe, busca, tipo, nivel, situacao]);

  const limpar = () => { setBusca(''); setTipo('todos'); setNivel('todos'); setSituacao('ativos'); };

  return (
    <>
      <p className="page-intro">
        Alertas em ordem de prioridade. A prioridade cruza o nível de risco com a confiança do dado.
      </p>

      <section className="card">
        <div className="filters">
          <div className="search grow" style={{ minWidth: 220 }}>
            <Search size={17} aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder="Buscar por bairro ou título"
              aria-label="Buscar por bairro ou título"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select className="select" aria-label="Tipo de risco" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(TIPOS).map(([chave, t]) => <option key={chave} value={chave}>{t.rotulo}</option>)}
          </select>
          <select className="select" aria-label="Nível de risco" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option value="todos">Todos os níveis</option>
            {[...NIVEIS].reverse().map((n) => <option key={n} value={n}>Risco {ROTULO_NIVEL[n]}</option>)}
          </select>
          <select className="select" aria-label="Situação" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="ativos">Ativos</option>
            {equipe ? <option value="validacao">Em validação</option> : null}
            <option value="encerrados">{equipe ? 'Encerrados e descartados' : 'Encerrados'}</option>
            <option value="todos">Todas as situações</option>
          </select>
        </div>
      </section>

      <section className="card card-flush">
        <div className="card-head" style={{ paddingBottom: 12, marginBottom: 0, borderBottom: '1px solid var(--line-2)' }}>
          <h2>{lista.length} {lista.length === 1 ? 'alerta' : 'alertas'}</h2>
          <span className="small muted">Ordem: P1 primeiro; no empate, o maior risco e depois o mais recente</span>
        </div>
        {lista.length === 0 ? (
          <Vazio icone={SearchX} titulo="Nenhum alerta encontrado">
            <button type="button" className="btn btn-ghost btn-sm" onClick={limpar}>Limpar filtros</button>
          </Vazio>
        ) : (
          <div className="alert-list">
            {lista.map((e) => <LinhaAlerta key={e.id} evento={e} agora={agora} />)}
          </div>
        )}
      </section>
    </>
  );
}
