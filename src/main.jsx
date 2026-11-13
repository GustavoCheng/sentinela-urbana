import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App.jsx';
import { Provedor } from './store.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provedor>
      <HashRouter>
        <App />
      </HashRouter>
    </Provedor>
  </StrictMode>,
);
