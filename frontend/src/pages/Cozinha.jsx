import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../App.jsx";
import PedidoCard from "../PedidoCard.jsx";
import { useLive } from "../useLive.js";

export default function Cozinha() {
  const [pedidos, setPedidos] = useState([]);
  const toast = useToast();

  useEffect(() => {
    api("/pedidos/").then(setPedidos).catch((e) => toast(e.message));
  }, []);

  useLive((pedido) => {
    setPedidos((atual) => {
      const existe = atual.some((p) => p.id === pedido.id);
      return existe ? atual.map((p) => (p.id === pedido.id ? pedido : p)) : [pedido, ...atual];
    });
  });

  async function marcarPronto(id) {
    try {
      await api(`/pedidos/${id}/status/`, { method: "PATCH", body: { status: "pronto" } });
    } catch (e) {
      toast(e.message);
    }
  }

  const fila = pedidos.filter((p) => p.status === "preparando");

  if (!fila.length) {
    return (
      <div className="vazio">
        <div className="icone">👨‍🍳</div>
        <p>
          Nenhum pedido na fila.
          <br />A cozinha está tranquila!
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="titulo-tela">👨‍🍳 Pedidos pra fazer ({fila.length})</h2>
      {fila.map((p) => (
        <PedidoCard
          key={p.id}
          pedido={p}
          acao={
            <button className="btn-status pronto" onClick={() => marcarPronto(p.id)}>
              ✓ Marcar pronto
            </button>
          }
        />
      ))}
    </>
  );
}
