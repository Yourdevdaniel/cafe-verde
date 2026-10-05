import { useEffect, useRef } from "react";

// Escuta o feed de pedidos em tempo real, com reconexão simples.
export function useLive(aoReceberPedido) {
  const callback = useRef(aoReceberPedido);
  callback.current = aoReceberPedido;

  useEffect(() => {
    let ws;
    let fechado = false;
    let timer;

    function conectar() {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/ws/pedidos/`);
      ws.onmessage = (e) => callback.current(JSON.parse(e.data));
      ws.onclose = () => {
        if (!fechado) timer = setTimeout(conectar, 3000);
      };
    }
    conectar();

    return () => {
      fechado = true;
      clearTimeout(timer);
      ws.close();
    };
  }, []);
}
