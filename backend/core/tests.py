from decimal import Decimal

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Produto


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class PedidoTests(APITestCase):
    def setUp(self):
        self.cafe = Produto.objects.create(
            categoria="Cafés", nome="Espresso", preco="7.00"
        )
        self.bolo = Produto.objects.create(
            categoria="Doces", nome="Bolo", preco="10.50"
        )

    def criar_pedido(self):
        return self.client.post(
            "/api/pedidos/",
            {
                "mesa": 3,
                "itens": [
                    {"produto": self.cafe.id, "quantidade": 2, "preco_unitario": "0.01"},
                    {"produto": self.bolo.id, "quantidade": 1},
                ],
            },
            format="json",
        )

    def test_cliente_cria_pedido_e_total_vem_do_banco(self):
        resp = self.criar_pedido()
        self.assertEqual(resp.status_code, 201)
        # preco_unitario enviado pelo cliente (0.01) é ignorado
        self.assertEqual(Decimal(resp.data["total"]), Decimal("24.50"))
        self.assertEqual(resp.data["status"], "preparando")

    def test_mesa_invalida_recusada(self):
        resp = self.client.post(
            "/api/pedidos/",
            {"mesa": 99, "itens": [{"produto": self.cafe.id, "quantidade": 1}]},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_anonimo_nao_muda_status_funcionario_sim(self):
        pedido_id = self.criar_pedido().data["id"]
        url = f"/api/pedidos/{pedido_id}/status/"

        resp = self.client.patch(url, {"status": "pronto"}, format="json")
        self.assertEqual(resp.status_code, 401)

        User.objects.create_user("cozinha", password="x")
        self.client.force_authenticate(User.objects.get(username="cozinha"))
        resp = self.client.patch(url, {"status": "pronto"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "pronto")

        resp = self.client.patch(url, {"status": "hackeado"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_avaliar_produto(self):
        url = f"/api/produtos/{self.cafe.id}/avaliar/"
        self.assertEqual(self.client.post(url, {"nota": 5}, format="json").status_code, 201)
        self.assertEqual(self.client.post(url, {"nota": 9}, format="json").status_code, 400)
        self.assertEqual(self.client.post(url, {"nota": "x"}, format="json").status_code, 400)

        resp = self.client.get("/api/produtos/")
        cafe = next(p for p in resp.data if p["id"] == self.cafe.id)
        self.assertEqual(cafe["nota_media"], 5.0)
        self.assertEqual(cafe["num_avaliacoes"], 1)
