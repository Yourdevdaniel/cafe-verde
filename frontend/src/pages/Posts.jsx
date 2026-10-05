import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Posts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api("/postagens/").then(setPosts).catch(() => {});
  }, []);

  return (
    <>
      <h2 className="titulo-tela">📰 Novidades do Café Verde</h2>
      {posts.map((p, i) => (
        <article className="postagem" key={p.id} style={{ "--i": i }}>
          <div className="capa">{p.emoji}</div>
          <div className="corpo">
            <div className="meta">
              {new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
            </div>
            <h3>{p.titulo}</h3>
            <p>{p.texto}</p>
          </div>
        </article>
      ))}
    </>
  );
}
