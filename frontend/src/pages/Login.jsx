import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../api.js";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    try {
      await auth.entrar(usuario, senha);
      navegar("/equipe");
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form className="cartao-form" onSubmit={entrar}>
      <h2>🔐 Área do funcionário</h2>
      <div className="campo">
        <label htmlFor="usuario">Usuário</label>
        <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username" required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password" required />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button className="btn-primario" type="submit">Entrar</button>
    </form>
  );
}
