from django.db import models

TOTAL_MESAS = 12


class Produto(models.Model):
    categoria = models.CharField(max_length=50)
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    emoji = models.CharField(max_length=8, default="☕")
    imagem = models.CharField(max_length=300, blank=True, default="")
    destaque = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ["categoria", "nome"]

    def __str__(self):
        return self.nome


class Pedido(models.Model):
    STATUS = [
        ("preparando", "Preparando"),
        ("pronto", "Pronto"),
        ("entregue", "Entregue"),
    ]
    mesa = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=10, choices=STATUS, default="preparando")
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Pedido {self.id} — mesa {self.mesa}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="itens")
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.PositiveSmallIntegerField()
    # preço congelado no momento do pedido, pra histórico não mudar se o cardápio mudar
    preco_unitario = models.DecimalField(max_digits=8, decimal_places=2)


class Avaliacao(models.Model):
    produto = models.ForeignKey(
        Produto, on_delete=models.CASCADE, related_name="avaliacoes"
    )
    nota = models.PositiveSmallIntegerField()
    criado_em = models.DateTimeField(auto_now_add=True)


class Postagem(models.Model):
    titulo = models.CharField(max_length=150)
    texto = models.TextField()
    emoji = models.CharField(max_length=8, default="📰")
    publicado = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return self.titulo
