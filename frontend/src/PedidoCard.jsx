import { dinheiro } from "./api.js";

const NOME_STATUS = { preparando: "Preparando", pronto: "Pronto", entregue: "Entregue" };

export default function PedidoCard({ pedido, acao }) {
  const hora = new Date(pedido.criado_em).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={`cartao-pedido ${pedido.status}`}>
      <div className="topo">
        <strong>
          Mesa {pedido.mesa} · {hora}
        </strong>
        <span className={`etiqueta ${pedido.status}`}>{NOME_STATUS[pedido.status]}</span>
      </div>
      <ul>
        {pedido.itens.map((i, idx) => (
          <li key={idx}>
            {i.quantidade}× {i.emoji} {i.nome}
          </li>
        ))}
      </ul>
      <span className="total">{dinheiro(pedido.total)}</span>
      {acao && <div className="acoes">{acao}</div>}
    </div>
  );
}
