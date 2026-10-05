from channels.generic.websocket import AsyncJsonWebsocketConsumer

GRUPO_PEDIDOS = "pedidos"


class PedidosConsumer(AsyncJsonWebsocketConsumer):
    """Transmite criação/mudança de status de pedidos em tempo real.

    Leitura aberta (sem token): o feed só contém mesa/itens/status, que o
    cliente da mesa também precisa ver. Toda escrita passa pela API REST.
    """

    async def connect(self):
        await self.channel_layer.group_add(GRUPO_PEDIDOS, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(GRUPO_PEDIDOS, self.channel_name)

    async def pedido_update(self, event):
        await self.send_json(event["pedido"])
