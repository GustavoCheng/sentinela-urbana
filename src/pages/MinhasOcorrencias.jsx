import { Link } from 'react-router-dom';
import { ArrowRight, Camera, CirclePlus, ClipboardList } from 'lucide-react';
import { useApp } from '../store.jsx';
import { CicloDeVida, ConfiancaBadge, NivelBadge, StatusTag, TipoIcone, Vazio, dataHora, tempoRelativo } from '../components/ui.jsx';

// Tela 8: Minhas ocorrências (RF13). Mostra o estado de cada registro no ciclo de vida.
export default function MinhasOcorrencias() {
  const { eventos, usuario, agora } = useApp();
  const minhas = eventos
    .map((e) => ({ evento: e, relato: e.fontes.find((f) => f.autorId === usuario.id) }))
    .filter((x) => x.relato)
    .sort((a, b) => b.relato.coletadoEm - a.relato.coletadoEm);

  return (
    <>
      <div className="row-wrap between">
        <p className="page-intro">
          Acompanhe cada registro seu, do recebimento ao encerramento. Você tem {usuario.relatosConfirmados} relatos
          confirmados.
        </p>
        <Link to="/registrar" className="btn btn-primary">
          <CirclePlus size={17} aria-hidden="true" /> Registrar ocorrência
        </Link>
      </div>

      {minhas.length === 0 ? (
        <section className="card">
          <Vazio icone={ClipboardList} titulo="Você ainda não registrou ocorrências">
            Quando registrar, o andamento aparece aqui.
          </Vazio>
        </section>
      ) : (
        minhas.map(({ evento, relato }) => {
          const ultimo = evento.historico[evento.historico.length - 1];
          return (
            <section key={evento.id} className="card stack">
              <div className="detail-head">
                <TipoIcone tipo={evento.tipo} nivel={evento.risco.nivel} />
                <div className="grow">
                  <h2>{evento.titulo}</h2>
                  <p className="small muted">
                    {evento.id} · registrado em {dataHora(relato.coletadoEm)} ({tempoRelativo(relato.coletadoEm, agora)})
                  </p>
                </div>
                <div className="row-wrap">
                  <StatusTag status={evento.status} />
                  <NivelBadge nivel={evento.risco.nivel} />
                  <ConfiancaBadge confianca={evento.confianca} />
                </div>
              </div>
              <p>
                <span className="muted small">Seu relato: </span>
                {relato.detalhe}{' '}
                {relato.foto ? <span className="chip chip-ok"><Camera size={12} aria-hidden="true" /> Com foto</span> : null}
              </p>
              <CicloDeVida evento={evento} />
              <div className="row-wrap between">
                <p className="small" style={{ color: 'var(--ink-2)' }}>
                  <span className="strong">{ultimo.status}:</span> {ultimo.nota}
                </p>
                <Link to={`/alertas/${evento.id}`} className="btn btn-ghost btn-sm">
                  Ver detalhes <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
