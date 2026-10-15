import { Navigate, Route, Routes } from "react-router-dom";
import { getUser, isAdmin } from "./api";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RequerantForm from "./pages/RequerantForm.jsx";
import RequerantGrid from "./pages/RequerantGrid.jsx";
import DocumentForm from "./pages/DocumentForm.jsx";
import Octroi from "./pages/Octroi.jsx";
import Imprimer from "./pages/Imprimer.jsx";
import Agents from "./pages/Agents.jsx";
import Parametres from "./pages/Parametres.jsx";

// Les droits sont relus à chaque affichage (pas figés au chargement).
const Private = ({ children }) => (getUser() && localStorage.getItem("token") ? children : <Navigate to="/login" replace />);
const AdminOnly = ({ children }) => (isAdmin() ? children : <Navigate to="/" replace />);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/demandes/:id/imprimer" element={<Private><Imprimer /></Private>} />
      <Route element={<Private><Layout /></Private>}>
        <Route index element={<Dashboard />} />
        <Route path="requerants" element={<RequerantGrid />} />
        <Route path="requerants/nouveau" element={<RequerantForm />} />
        <Route path="requerants/:id/modifier" element={<RequerantForm />} />
        <Route path="documents" element={<DocumentForm />} />
        <Route path="octroi" element={<Octroi />} />
        <Route path="agents" element={<AdminOnly><Agents /></AdminOnly>} />
        <Route path="parametres" element={<AdminOnly><Parametres /></AdminOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
