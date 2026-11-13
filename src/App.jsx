import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './store.jsx';
import Layout from './components/Layout.jsx';
import Acesso from './pages/Acesso.jsx';
import Painel from './pages/Painel.jsx';
import Alertas from './pages/Alertas.jsx';
import AlertaDetalhe from './pages/AlertaDetalhe.jsx';
import OrigemConfianca from './pages/OrigemConfianca.jsx';
import Notificacoes from './pages/Notificacoes.jsx';
import Registrar from './pages/Registrar.jsx';
import MinhasOcorrencias from './pages/MinhasOcorrencias.jsx';
import Validacao from './pages/Validacao.jsx';
import Fontes from './pages/Fontes.jsx';
import Analises from './pages/Analises.jsx';
import Preferencias from './pages/Preferencias.jsx';
import Privacidade from './pages/Privacidade.jsx';

// RF18: cada perfil só alcança as telas liberadas para ele.
function So({ quem, children }) {
  const { equipe } = useApp();
  const liberado = quem === 'equipe' ? equipe : !equipe;
  return liberado ? children : <Navigate to="/painel" replace />;
}

export default function App() {
  const { perfil } = useApp();

  if (!perfil) {
    return (
      <Routes>
        <Route path="/" element={<Acesso />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/painel" element={<Painel />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/alertas/:id" element={<AlertaDetalhe />} />
        <Route path="/alertas/:id/origem" element={<OrigemConfianca />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/registrar" element={<So quem="morador"><Registrar /></So>} />
        <Route path="/ocorrencias" element={<So quem="morador"><MinhasOcorrencias /></So>} />
        <Route path="/validacao" element={<So quem="equipe"><Validacao /></So>} />
        <Route path="/fontes" element={<So quem="equipe"><Fontes /></So>} />
        <Route path="/analises" element={<So quem="equipe"><Analises /></So>} />
        <Route path="/preferencias" element={<Preferencias />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Route>
    </Routes>
  );
}
