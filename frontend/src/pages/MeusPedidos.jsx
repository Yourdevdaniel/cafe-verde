import { useEffect, useState } from "react";
import { api } from "../api.js";
import PedidoCard from "../PedidoCard.jsx";
import { useLive } from "../useLive.js";

const FILTROS = [
  { valor: "todos", rotulo: "Todos", emoji: "📋" },
  { valor: "preparando", rotulo: "Preparando", emoji: "⏳" },
  { valor: "pronto", rotulo: "Prontos", emoji: "✅" },
  { valor: "entregue", rotulo: "Entregues", emoji: "🤝" },
];

export default function MeusPedidos() {
  const ids = JSON.parse(localStorage.getItem("meusPedidos") || "[]");
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    Promise.all(ids.map((id) => api(`/pedidos/${id}/`).catch(() => null))).then((lista) =>
      setPedidos(lista.filter(Boolean).reverse())
    );
  }, []);

  // status atualiza ao vivo quando a cozinha mexe no pedido
  useLive((pedido) => {
    if (!ids.includes(pedido.id)) return;
    setPedidos((atual) => atual.map((p) => (p.id === pedido.id ? pedido : p)));
  });

  if (!pedidos.length) {
    return (
      <div className="vazio">
        <div className="icone">📋</div>
        <p>
          Você ainda não fez nenhum pedido.
          <br />
          Dá uma olhada no cardápio! ☕
        </p>
      </div>
    );
  }

  const conta = (v) => (v === "todos" ? pedidos.length : pedidos.filter((p) => p.status === v).length);
  const visiveis = filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro);

  return (
    <>
      <h2 className="titulo-tela">📋 Meus pedidos</h2>
      <div className="chips-status">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            className={`chip ${filtro === f.valor ? "ativa" : ""}`}
            onClick={() => setFiltro(f.valor)}
          >
            <span aria-hidden="true">{f.emoji}</span> {f.rotulo}
            <span className="cont">{conta(f.valor)}</span>
          </button>
        ))}
      </div>
      {visiveis.length ? (
        visiveis.map((p) => <PedidoCard key={p.id} pedido={p} />)
      ) : (
        <div className="vazio">
          <div className="icone">🫙</div>
          <p>Nenhum pedido nesse status agora.</p>
        </div>
      )}
    </>
  );
}
