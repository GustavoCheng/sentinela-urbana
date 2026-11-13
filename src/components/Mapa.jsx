import { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { House, MapPin } from 'lucide-react';
import { ICONE_TIPO, NivelBadge, ConfiancaBadge, FontesResumo, StatusTag } from './ui.jsx';
import { RAIO_INTERESSE_KM, STATUS } from '../domain/regras.js';

const SAO_PAULO = [-23.535, -46.57];
const cache = new Map();

function pino(classe, Icone, nome, tamanho = 36) {
  const chave = `${classe}-${nome}-${tamanho}`;
  if (!cache.has(chave)) {
    cache.set(
      chave,
      L.divIcon({
        className: 'pin-wrap',
        html: `<div class="pin ${classe}">${renderToStaticMarkup(<Icone size={tamanho / 2.2} strokeWidth={2.4} />)}</div>`,
        iconSize: [tamanho, tamanho],
        iconAnchor: [tamanho / 2, tamanho / 2],
        popupAnchor: [0, -tamanho / 2],
      }),
    );
  }
  return cache.get(chave);
}

function Enquadrar({ pontos }) {
  const mapa = useMap();
  const assinatura = pontos.map((p) => p.join(',')).join(';');
  useEffect(() => {
    if (pontos.length === 1) mapa.setView(pontos[0], 14);
    else if (pontos.length > 1) mapa.fitBounds(pontos, { padding: [44, 44], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, mapa]);
  return null;
}

const camada = (
  <TileLayer
    attribution='&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
);

// Mapa do painel: um pino por evento, com cor e ícone pelo nível de risco e tipo.
export const MapaEventos = memo(function MapaEventos({ eventos, locais = [], altura = 440, arredondado }) {
  const pontos = eventos.map((e) => [e.lat, e.lng]);
  return (
    <MapContainer
      center={SAO_PAULO}
      zoom={11}
      scrollWheelZoom
      className={`map ${arredondado ? 'map-round' : ''}`}
      style={{ height: altura }}
    >
      {camada}
      <Enquadrar pontos={pontos.length ? pontos : locais.map((l) => [l.lat, l.lng])} />
      {locais.map((l) => (
        <Circle
          key={`raio-${l.id}`}
          center={[l.lat, l.lng]}
          radius={RAIO_INTERESSE_KM * 1000}
          pathOptions={{ color: '#0c2238', weight: 1.5, dashArray: '6 6', fillOpacity: 0.04 }}
        />
      ))}
      {locais.map((l) => (
        <Marker key={l.id} position={[l.lat, l.lng]} icon={pino('pin-local', House, 'local', 28)} zIndexOffset={-100}>
          <Popup>
            <strong>{l.nome}</strong>
            <br />
            Local de interesse, com raio de {RAIO_INTERESSE_KM} km.
          </Popup>
        </Marker>
      ))}
      {eventos.map((e) => {
        const pendente = e.status === STATUS.validacao;
        return (
          <Marker
            key={e.id}
            position={[e.lat, e.lng]}
            icon={pino(pendente ? 'pin-pendente' : `pin-${e.risco.nivel}`, ICONE_TIPO[e.tipo], e.tipo)}
            zIndexOffset={e.risco.produto * 10}
            title={e.titulo}
          >
            <Popup>
              <div className="stack-sm">
                <strong>{e.titulo}</strong>
                <div className="row-wrap">
                  <NivelBadge nivel={e.risco.nivel} />
                  <StatusTag status={e.status} />
                </div>
                <div className="row-wrap">
                  <ConfiancaBadge confianca={e.confianca} />
                </div>
                <div className="row-wrap">
                  <FontesResumo fontes={e.fontes} />
                </div>
                <Link to={`/alertas/${e.id}`} className="strong">Ver detalhes</Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
});

function Clique({ aoMudar }) {
  useMapEvents({ click: (e) => aoMudar({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Mantém o ponto marcado visível quando ele muda por um atalho ("Perto de Casa").
function Centralizar({ posicao }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicao && !mapa.getBounds().pad(-0.2).contains([posicao.lat, posicao.lng])) {
      mapa.setView([posicao.lat, posicao.lng], Math.max(mapa.getZoom(), 14));
    }
  }, [posicao, mapa]);
  return null;
}

// Mapa do registro comunitário: o morador toca no ponto da ocorrência.
export function MapaSelecao({ posicao, aoMudar, altura = 340 }) {
  return (
    <MapContainer
      center={posicao ? [posicao.lat, posicao.lng] : SAO_PAULO}
      zoom={posicao ? 14 : 11}
      scrollWheelZoom
      className="map map-round"
      style={{ height: altura }}
    >
      {camada}
      <Clique aoMudar={aoMudar} />
      <Centralizar posicao={posicao} />
      {posicao ? <Marker position={[posicao.lat, posicao.lng]} icon={pino('pin-novo', MapPin, 'novo')} /> : null}
    </MapContainer>
  );
}
