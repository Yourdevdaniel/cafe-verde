import { useEffect, useState } from "react";
import { api, dinheiro } from "../api.js";
import { useToast } from "../App.jsx";

const PRODUTO_VAZIO = { categoria: "", nome: "", descricao: "", preco: "", emoji: "☕", imagem: "", destaque: false, ativo: true };
const POST_VAZIO = { titulo: "", texto: "", emoji: "📰", publicado: true };

export default function Admin() {
  const [resumo, setResumo] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [posts, setPosts] = useState([]);
  const [produto, setProduto] = useState(PRODUTO_VAZIO); // em edição/criação
  const [post, setPost] = useState(POST_VAZIO);
  const toast = useToast();

  function carregar() {
    api("/pedidos/resumo/").then(setResumo).catch((e) => toast(e.message));
    api("/produtos/").then(setProdutos).catch(() => {});
    api("/postagens/").then(setPosts).catch(() => {});
  }
  useEffect(carregar, []);

  async function salvarProduto(e) {
    e.preventDefault();
    try {
      if (produto.id) {
        await api(`/produtos/${produto.id}/`, { method: "PUT", body: produto });
      } else {
        await api("/produtos/", { method: "POST", body: produto });
      }
      setProduto(PRODUTO_VAZIO);
      carregar();
      toast("Produto salvo!");
    } catch (err) {
      toast(err.message);
    }
  }

  async function alternarAtivo(p) {
    await api(`/produtos/${p.id}/`, { method: "PATCH", body: { ativo: !p.ativo } });
    carregar();
  }

  async function salvarPost(e) {
    e.preventDefault();
    try {
      await api("/postagens/", { method: "POST", body: post });
      setPost(POST_VAZIO);
      carregar();
      toast("Postagem publicada!");
    } catch (err) {
      toast(err.message);
    }
  }

  async function apagarPost(id) {
    await api(`/postagens/${id}/`, { method: "DELETE" });
    carregar();
  }

  return (
    <>
      <h2 className="titulo-tela">📊 Gerência</h2>

      {resumo && (
        <div className="painel-resumo">
          {[
            [resumo.pedidos_hoje, "Pedidos hoje"],
            [dinheiro(resumo.faturamento_hoje), "Faturamento hoje"],
            [resumo.na_fila, "Na fila"],
            [resumo.prontos, "Prontos"],
          ].map(([valor, rotulo], i) => (
            <div className="stat" key={rotulo} style={{ "--i": i }}>
              <div className="valor">{valor}</div>
              <div className="rotulo">{rotulo}</div>
            </div>
          ))}
        </div>
      )}

      <section className="secao-admin">
        <h2 className="titulo-tela">☕ Cardápio</h2>
        <form className="cartao-form" style={{ margin: "0 0 18px", maxWidth: "none" }} onSubmit={salvarProduto}>
          <h2>{produto.id ? `Editando: ${produto.nome}` : "Novo produto"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 10 }}>
            <div className="campo">
              <label>Nome</label>
              <input value={produto.nome} required
                onChange={(e) => setProduto({ ...produto, nome: e.target.value })} />
            </div>
            <div className="campo">
              <label>Categoria</label>
              <input value={produto.categoria} required list="categorias-existentes"
                onChange={(e) => setProduto({ ...produto, categoria: e.target.value })} />
              <datalist id="categorias-existentes">
                {[...new Set(produtos.map((p) => p.categoria))].map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="campo">
              <label>Preço (R$)</label>
              <input type="number" step="0.01" min="0" value={produto.preco} required
                onChange={(e) => setProduto({ ...produto, preco: e.target.value })} />
            </div>
            <div className="campo">
              <label>Emoji</label>
              <input value={produto.emoji}
                onChange={(e) => setProduto({ ...produto, emoji: e.target.value })} />
            </div>
          </div>
          <div className="campo">
            <label>Descrição</label>
            <textarea rows="2" value={produto.descricao}
              onChange={(e) => setProduto({ ...produto, descricao: e.target.value })} />
          </div>
          <div className="campo">
            <label>Foto (URL ou /img/arquivo.jpg)</label>
            <input value={produto.imagem} placeholder="/img/espresso.jpg"
              onChange={(e) => setProduto({ ...produto, imagem: e.target.value })} />
          </div>
          <div className="campo">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" style={{ width: "auto" }} checked={produto.destaque}
                onChange={(e) => setProduto({ ...produto, destaque: e.target.checked })} />
              🔥 Mostrar nos Destaques da casa
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primario" type="submit" style={{ marginTop: 0 }}>
              {produto.id ? "Salvar alterações" : "Adicionar ao cardápio"}
            </button>
            {produto.id && (
              <button className="btn-primario" type="button" style={{ marginTop: 0, background: "var(--marrom-claro)" }}
                onClick={() => setProduto(PRODUTO_VAZIO)}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <table className="tabela">
          <thead>
            <tr><th></th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.5 }}>
                <td>{p.imagem ? <img className="thumb" src={p.imagem} alt="" /> : p.emoji}</td>
                <td>{p.nome} {p.destaque && "🔥"}</td>
                <td>{p.categoria}</td>
                <td>{dinheiro(p.preco)}</td>
                <td>{p.ativo ? "Ativo" : "Pausado"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn-mini" onClick={() => setProduto(p)}>✏️ Editar</button>{" "}
                  <button className="btn-mini" onClick={() => alternarAtivo(p)}>
                    {p.ativo ? "⏸ Pausar" : "▶ Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="secao-admin">
        <h2 className="titulo-tela">📰 Postagens</h2>
        <form className="cartao-form" style={{ margin: "0 0 18px", maxWidth: "none" }} onSubmit={salvarPost}>
          <h2>Nova postagem</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
            <div className="campo">
              <label>Título</label>
              <input value={post.titulo} required
                onChange={(e) => setPost({ ...post, titulo: e.target.value })} />
            </div>
            <div className="campo">
              <label>Emoji</label>
              <input value={post.emoji} onChange={(e) => setPost({ ...post, emoji: e.target.value })} />
            </div>
          </div>
          <div className="campo">
            <label>Texto</label>
            <textarea rows="3" value={post.texto} required
              onChange={(e) => setPost({ ...post, texto: e.target.value })} />
          </div>
          <button className="btn-primario" type="submit" style={{ marginTop: 0 }}>Publicar</button>
        </form>

        <table className="tabela">
          <thead>
            <tr><th>Postagem</th><th>Data</th><th></th></tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.emoji} {p.titulo}</td>
                <td>{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                <td>
                  <button className="btn-mini perigo" onClick={() => apagarPost(p.id)}>🗑 Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
