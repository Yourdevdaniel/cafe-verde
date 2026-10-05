import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "../App.jsx";
import PedidoCard from "../PedidoCard.jsx";
import { useLive } from "../useLive.js";

export default function Garcom() {
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

  async function entregar(id) {
    try {
      await api(`/pedidos/${id}/status/`, { method: "PATCH", body: { status: "entregue" } });
      toast("Pedido entregue! ✅");
    } catch (e) {
      toast(e.message);
    }
  }

  const prontos = pedidos.filter((p) => p.status === "pronto");
  const preparando = pedidos.filter((p) => p.status === "preparando");

  return (
    <>
      <h2 className="titulo-tela">🚶 Prontos pra entregar ({prontos.length})</h2>
      {prontos.length === 0 && (
        <div className="vazio">
          <div className="icone">🚶</div>
          <p>Nada pronto no balcão agora.</p>
        </div>
      )}
      {prontos.map((p) => (
        <PedidoCard
          key={p.id}
          pedido={p}
          acao={
            <button className="btn-status entregar" onClick={() => entregar(p.id)}>
              🚶 Entregar na mesa {p.mesa}
            </button>
          }
        />
      ))}
      {preparando.length > 0 && (
        <>
          <h2 className="titulo-tela" style={{ marginTop: 30 }}>
            ⏳ Em preparo ({preparando.length})
          </h2>
          {preparando.map((p) => (
            <PedidoCard key={p.id} pedido={p} />
          ))}
        </>
      )}
    </>
  );
}
