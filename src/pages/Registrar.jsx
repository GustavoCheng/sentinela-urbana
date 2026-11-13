import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, CircleCheck, EyeOff, MapPin, Send, TriangleAlert } from 'lucide-react';
import { useApp } from '../store.jsx';
import { MapaSelecao } from '../components/Mapa.jsx';
import { ConfiancaBadge, ICONE_TIPO, NivelBadge, PrioridadeTag, StatusTag } from '../components/ui.jsx';
import { TIPOS } from '../domain/regras.js';
import { bairroMaisProximo } from '../domain/pipeline.js';

const PASSOS = ['Tipo', 'Intensidade', 'Local', 'Confirmação'];
const LIMITE_AREA_KM = 4;

// Tela 7: Registrar ocorrência (RF03). Quatro passos, como pede o RNF06.
export default function Registrar() {
  const { usuario, eventos, acoes } = useApp();
  const [passo, setPasso] = useState(0);
  const [tipo, setTipo] = useState(null);
  const [severidade, setSeveridade] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState(null);
  const [posicao, setPosicao] = useState(null);
  const [aceite, setAceite] = useState(false);
  const [resultado, setResultado] = useState(null);

  const perto = posicao ? bairroMaisProximo(posicao) : null;
  const foraDaArea = perto ? perto.km > LIMITE_AREA_KM : false;
  const podeAvancar = [Boolean(tipo), Boolean(severidade), Boolean(posicao) && !foraDaArea, aceite][passo];

  const enviar = () => {
    const r = acoes.registrarOcorrencia({
      tipo,
      severidade,
      descricao: descricao.trim(),
      foto: Boolean(foto),
      lat: posicao.lat,
      lng: posicao.lng,
      bairroId: perto.bairro.id,
    });
    setResultado(r);
  };

  const recomecar = () => {
    setPasso(0); setTipo(null); setSeveridade(null); setDescricao(''); setFoto(null); setPosicao(null);
    setAceite(false); setResultado(null);
  };

  if (resultado) {
    const evento = eventos.find((e) => e.id === resultado.eventoId);
    return (
      <section className="card stack" style={{ maxWidth: 760 }}>
        <div className="row">
          <CircleCheck size={34} color="var(--baixo-solid)" aria-hidden="true" />
          <div>
            <h2>{resultado.agrupado ? 'Registro agrupado a um evento existente' : 'Registro recebido'}</h2>
            <p className="muted small">Protocolo {resultado.eventoId}. Obrigado por avisar a sua vizinhança.</p>
          </div>
        </div>
        {evento ? (
          <div className="row-wrap">
            <StatusTag status={evento.status} />
            <NivelBadge nivel={evento.risco.nivel} />
            <ConfiancaBadge confianca={evento.confianca} />
            <PrioridadeTag prioridade={evento.prioridade} />
          </div>
        ) : null}
        <div>
          <h3 style={{ marginBottom: 4 }}>O que aconteceu com o seu registro</h3>
          <ol className="pipeline">
            {resultado.passos.map((p, i) => (
              <li key={p.etapa}>
                <span className="n">{i + 1}</span>
                <span><span className="strong">{p.etapa}.</span> {p.texto}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="row-wrap">
          <Link to="/ocorrencias" className="btn btn-primary">Acompanhar em Minhas ocorrências</Link>
          <button type="button" className="btn btn-ghost" onClick={recomecar}>Registrar outra ocorrência</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card stack" style={{ maxWidth: 820 }}>
      <ol className="steps" aria-label="Passos do registro">
        {PASSOS.map((p, i) => (
          <li key={p} className={i < passo ? 'done' : i === passo ? 'current' : ''} aria-current={i === passo ? 'step' : undefined}>
            {i + 1}. {p}
          </li>
        ))}
      </ol>

      {passo === 0 ? (
        <div className="stack">
          <div>
            <h2>O que está acontecendo?</h2>
            <p className="muted small">Escolha o tipo de risco.</p>
          </div>
          <div className="options" role="radiogroup" aria-label="Tipo de risco">
            {Object.entries(TIPOS).map(([chave, t]) => {
              const Icone = ICONE_TIPO[chave];
              return (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={tipo === chave}
                  className="option"
                  onClick={() => { setTipo(chave); setSeveridade(null); }}
                >
                  <span className="tipo-ic"><Icone size={20} aria-hidden="true" /></span>
                  {t.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {passo === 1 ? (
        <div className="stack">
          <div>
            <h2>Qual é a intensidade?</h2>
            <p className="muted small">{TIPOS[tipo].rotulo}: escolha a opção mais próxima do que você vê.</p>
          </div>
          <div className="stack-sm" role="radiogroup" aria-label="Intensidade">
            {TIPOS[tipo].intensidades.map((texto, i) => (
              <button
                key={texto}
                type="button"
                role="radio"
                aria-checked={severidade === i + 1}
                className="option"
                onClick={() => setSeveridade(i + 1)}
              >
                <span className="n">{i + 1}</span>
                {texto}
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="descricao">Descrição (opcional)</label>
            <textarea
              id="descricao"
              className="textarea"
              maxLength={240}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: água cobrindo a calçada em frente à padaria."
            />
            <span className="hint">{descricao.length} de 240 caracteres. Não escreva nomes nem dados pessoais.</span>
          </div>
          <div className="field">
            <span className="label">Foto (opcional)</span>
            <div className="row-wrap">
              <label className="btn btn-ghost" htmlFor="foto">
                <Camera size={16} aria-hidden="true" /> {foto ? 'Trocar foto' : 'Anexar foto'}
              </label>
              <input
                id="foto"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setFoto(e.target.files[0] ? e.target.files[0].name : null)}
              />
              {foto ? (
                <>
                  <span className="chip chip-ok"><Camera size={12} aria-hidden="true" /> {foto}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFoto(null)}>Remover</button>
                </>
              ) : null}
            </div>
            <span className="hint">Um registro com foto soma 10 pontos de confiança.</span>
          </div>
        </div>
      ) : null}

      {passo === 2 ? (
        <div className="stack">
          <div>
            <h2>Onde está acontecendo?</h2>
            <p className="muted small">Toque no mapa para marcar o ponto ou use um dos seus locais.</p>
          </div>
          <div className="row-wrap">
            {usuario.locais.map((l) => (
              <button key={l.id} type="button" className="pill" onClick={() => setPosicao({ lat: l.lat, lng: l.lng })}>
                <MapPin size={14} aria-hidden="true" /> Perto de {l.nome}
              </button>
            ))}
          </div>
          <MapaSelecao posicao={posicao} aoMudar={setPosicao} />
          {perto && !foraDaArea ? (
            <p className="row small">
              <MapPin size={16} aria-hidden="true" /> Ponto marcado em <span className="strong">{perto.bairro.nome}</span>
            </p>
          ) : null}
          {foraDaArea ? (
            <div className="note note-warn">
              <TriangleAlert size={17} aria-hidden="true" />
              <span>Este ponto está fora da área atendida. Marque um local mais próximo dos bairros cobertos.</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {passo === 3 ? (
        <div className="stack">
          <div>
            <h2>Confira e envie</h2>
            <p className="muted small">Depois de enviado, o registro passa por validação antes de virar alerta.</p>
          </div>
          <dl className="review">
            <dt>Tipo</dt><dd>{TIPOS[tipo].rotulo}</dd>
            <dt>Intensidade</dt><dd>{TIPOS[tipo].intensidades[severidade - 1]}</dd>
            <dt>Local</dt><dd>{perto.bairro.nome}</dd>
            <dt>Descrição</dt><dd>{descricao.trim() || 'Sem descrição'}</dd>
            <dt>Foto</dt><dd>{foto || 'Sem foto'}</dd>
          </dl>
          <div className="note">
            <EyeOff size={17} aria-hidden="true" />
            <span>
              Seu nome não aparece para outros moradores. O relato é exibido como "Morador da região" e só a equipe
              de validação vê quem enviou.
            </span>
          </div>
          <label className="check-line">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span>Autorizo o uso da localização e da foto deste registro para validar a ocorrência.</span>
          </label>
        </div>
      ) : null}

      <div className="wizard-foot">
        <button type="button" className="btn btn-ghost" disabled={passo === 0} onClick={() => setPasso(passo - 1)}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </button>
        {passo < 3 ? (
          <button type="button" className="btn btn-primary" disabled={!podeAvancar} onClick={() => setPasso(passo + 1)}>
            Continuar <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!podeAvancar} onClick={enviar}>
            <Send size={16} aria-hidden="true" /> Enviar registro
          </button>
        )}
      </div>
    </section>
  );
}
