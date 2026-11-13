import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Alternador, ICONE_TIPO } from '../components/ui.jsx';
import { BAIRROS, bairroPorId } from '../data/seed.js';
import { NIVEIS, RAIO_INTERESSE_KM, ROTULO_NIVEL, TIPOS } from '../domain/regras.js';

// Tela 12: Preferências de notificação (RF17, RN08).
export default function Preferencias() {
  const { usuario, acoes } = useApp();
  const [locais, setLocais] = useState(usuario.locais);
  const [tipos, setTipos] = useState(usuario.tipos);
  const [nivelMinimo, setNivelMinimo] = useState(usuario.nivelMinimo);
  const [canais, setCanais] = useState(usuario.canais);
  const [nome, setNome] = useState('');
  const [bairroId, setBairroId] = useState(BAIRROS[0].id);

  const alternarTipo = (t) => setTipos(tipos.includes(t) ? tipos.filter((x) => x !== t) : [...tipos, t]);

  const adicionar = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const b = bairroPorId(bairroId);
    setLocais([...locais, { id: `local-${Date.now()}`, nome: nome.trim(), bairroId, lat: b.lat, lng: b.lng }]);
    setNome('');
  };

  const salvar = () => {
    acoes.salvarPreferencias({ locais, tipos, nivelMinimo, canais });
    acoes.avisar('Preferências salvas.');
  };

  return (
    <>
      <p className="page-intro">
        Você recebe um alerta quando ele fica a até {RAIO_INTERESSE_KM} km de um local de interesse e combina com os
        tipos e o nível escolhidos aqui.
      </p>

      <div className="grid-half">
        <section className="card stack">
          <h2>Locais de interesse</h2>
          {locais.length === 0 ? <p className="muted small">Nenhum local. Sem locais, você não recebe alertas por região.</p> : null}
          <ul className="stack-sm">
            {locais.map((l) => (
              <li key={l.id} className="row">
                <span className="tipo-ic"><MapPin size={18} aria-hidden="true" /></span>
                <span className="grow">
                  <span className="strong">{l.nome}</span>
                  <span className="small muted" style={{ display: 'block' }}>{bairroPorId(l.bairroId).nome} · raio de {RAIO_INTERESSE_KM} km</span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label={`Remover ${l.nome}`}
                  onClick={() => setLocais(locais.filter((x) => x.id !== l.id))}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <form className="row-wrap" onSubmit={adicionar} style={{ alignItems: 'flex-end' }}>
            <div className="field grow" style={{ minWidth: 140 }}>
              <label htmlFor="nome-local">Nome do local</label>
              <input id="nome-local" className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Escola" />
            </div>
            <div className="field grow" style={{ minWidth: 160 }}>
              <label htmlFor="bairro-local">Bairro</label>
              <select id="bairro-local" className="select" value={bairroId} onChange={(e) => setBairroId(e.target.value)}>
                {BAIRROS.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-ghost" disabled={!nome.trim()}>
              <Plus size={16} aria-hidden="true" /> Adicionar
            </button>
          </form>
        </section>

        <div className="stack">
          <section className="card stack">
            <h2>Tipos de risco</h2>
            <div className="pills" role="group" aria-label="Tipos de risco que geram notificação">
              {Object.entries(TIPOS).map(([chave, t]) => {
                const Icone = ICONE_TIPO[chave];
                return (
                  <button key={chave} type="button" className="pill" aria-pressed={tipos.includes(chave)} onClick={() => alternarTipo(chave)}>
                    <Icone size={14} aria-hidden="true" /> {t.rotulo}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card stack">
            <h2>Nível mínimo de risco</h2>
            <div className="pills" role="radiogroup" aria-label="Nível mínimo de risco">
              {NIVEIS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={nivelMinimo === n} aria-pressed={nivelMinimo === n} className="pill" onClick={() => setNivelMinimo(n)}>
                  A partir de {ROTULO_NIVEL[n]}
                </button>
              ))}
            </div>
            <div className="note">
              <Info size={17} aria-hidden="true" />
              <span>Alertas de risco Crítico chegam sempre, qualquer que seja o nível escolhido.</span>
            </div>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: 4 }}>Canais</h2>
            <Alternador marcado={canais.push} aoMudar={(v) => setCanais({ ...canais, push: v })} titulo="Notificação push" descricao="Usada em alertas P1 e P2." />
            <Alternador marcado={canais.sms} aoMudar={(v) => setCanais({ ...canais, sms: v })} titulo="SMS" descricao="Usado apenas em alertas P1." />
            <Alternador marcado={canais.email} aoMudar={(v) => setCanais({ ...canais, email: v })} titulo="E-mail" descricao="Resumo diário dos alertas da sua região." />
            <p className="small muted" style={{ marginTop: 8 }}>
              A central do aplicativo guarda todos os avisos. Para parar de receber alertas, revogue o consentimento
              em <Link to="/privacidade">Privacidade</Link>.
            </p>
          </section>
        </div>
      </div>

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={salvar}>
          <Save size={16} aria-hidden="true" /> Salvar preferências
        </button>
      </div>
    </>
  );
}
