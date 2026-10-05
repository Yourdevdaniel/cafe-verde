import { createContext, useCallback, useContext, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { auth } from "./api.js";
import Cardapio from "./pages/Cardapio.jsx";
import Equipe from "./pages/Equipe.jsx";
import Login from "./pages/Login.jsx";
import MeusPedidos from "./pages/MeusPedidos.jsx";
import Posts from "./pages/Posts.jsx";

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

function RotaProtegida({ children }) {
  return auth.logado() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [toast, setToast] = useState(null);
  const navegar = useNavigate();
  const mostrarToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={mostrarToast}>
      <header>
        <div className="header-top">
          <div className="logo">
            <span className="xicara">☕</span>
            <div>
              Café Verde<small>cafeteria artesanal</small>
            </div>
          </div>
          <button className="btn-func" onClick={() => navegar("/equipe")}>
            👤 Área do funcionário
          </button>
        </div>
        <nav className="abas">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "ativa" : "")}>
            Cardápio
          </NavLink>
          <NavLink to="/meus-pedidos" className={({ isActive }) => (isActive ? "ativa" : "")}>
            Meus pedidos
          </NavLink>
          <NavLink to="/postagens" className={({ isActive }) => (isActive ? "ativa" : "")}>
            Postagens
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Cardapio />} />
          <Route path="/meus-pedidos" element={<MeusPedidos />} />
          <Route path="/postagens" element={<Posts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/equipe" element={<RotaProtegida><Equipe /></RotaProtegida>} />
        </Routes>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </ToastContext.Provider>
  );
}
