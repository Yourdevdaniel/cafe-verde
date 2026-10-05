import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "../api.js";
import Admin from "./Admin.jsx";
import Cozinha from "./Cozinha.jsx";
import Garcom from "./Garcom.jsx";

const ABAS = {
  gerencia: { rotulo: "📊 Gerência", tela: <Admin /> },
  cozinha: { rotulo: "👨‍🍳 Cozinha", tela: <Cozinha /> },
  garcom: { rotulo: "🚶 Garçom", tela: <Garcom /> },
};

function abasDoUsuario(eu) {
  if (eu.is_staff) return ["gerencia", "cozinha", "garcom"];
  return ["cozinha", "garcom"].filter((g) => eu.grupos.includes(g));
}

export default function Equipe() {
  const [eu, setEu] = useState(null);
  const [aba, setAba] = useState(null);
  const navegar = useNavigate();

  useEffect(() => {
    api("/me/")
      .then((dados) => {
        setEu(dados);
        setAba(abasDoUsuario(dados)[0]);
      })
      .catch(() => {
        auth.sair();
        navegar("/login");
      });
  }, []);

  if (!eu || !aba) return null;
  const abas = abasDoUsuario(eu);

  return (
    <>
      <div className="barra-equipe">
        <span className="ola">Olá, <strong>{eu.username}</strong></span>
        <button className="btn-mini" onClick={() => { auth.sair(); navegar("/"); }}>
          Sair
        </button>
      </div>
      {abas.length > 1 && (
        <div className="abas-equipe">
          {abas.map((a) => (
            <button key={a} className={a === aba ? "ativa" : ""} onClick={() => setAba(a)}>
              {ABAS[a].rotulo}
            </button>
          ))}
        </div>
      )}
      {ABAS[aba].tela}
    </>
  );
}
