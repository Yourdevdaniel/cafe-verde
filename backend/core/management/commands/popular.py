import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Avaliacao, ItemPedido, Pedido, Postagem, Produto

PRODUTOS_EXTRAS = [
    ("Cafés", "Macchiato", "Espresso manchado com espuma de leite. Curto e marcante.", "9.50", "☕"),
    ("Cafés", "Affogato", "Bola de sorvete de baunilha afogada em espresso quente.", "16.50", "🍨"),
    ("Bebidas Geladas", "Limonada Suíça", "Limão batido com casca, gelado e cremoso.", "10.00", "🍋"),
    ("Bebidas Geladas", "Matcha Gelado", "Chá verde matcha com leite e gelo.", "15.50", "🍵"),
    ("Salgados", "Coxinha de Frango", "Crocante por fora, cremosa por dentro. Unidade.", "8.50", "🍗"),
    ("Salgados", "Misto Quente", "Pão de forma na chapa, presunto e muito queijo.", "12.00", "🥪"),
    ("Salgados", "Quiche de Alho-Poró", "Massa amanteigada e recheio suave. Fatia.", "13.50", "🥧"),
    ("Doces", "Pudim de Leite", "Clássico de leite condensado com calda de caramelo.", "9.50", "🍮"),
    ("Doces", "Cheesecake de Frutas Vermelhas", "Base crocante, creme leve e calda da casa.", "14.00", "🍓"),
    ("Doces", "Pastel de Nata", "Massa folhada e creme queimadinho, estilo português.", "7.50", "🫓"),
    ("Combos", "Combo Kids", "Chocolate gelado + cookie + pão de queijo.", "16.90", "🧒"),
]

POSTAGENS_EXTRAS = [
    ("Fim de semana com horário estendido", "Sexta e sábado agora fechamos às 22h! Perfeito pra aquele café depois do cinema. Domingo seguimos das 8h às 20h.", "🌙"),
    ("Clube do grão: assinatura mensal", "Receba em casa 500g do grão da estação, torrado na semana do envio. Assinantes têm 15% de desconto no balcão. Pergunte ao caixa como participar.", "📦"),
    ("Oficina de barista pra clientes", "No último sábado do mês, nosso barista-chefe ensina métodos de preparo em casa: coado, prensa francesa e moka. Vagas limitadas, inscrição no balcão.", "🎓"),
]


class Command(BaseCommand):
    help = "Popula o banco com dados de demonstração: produtos, postagens, avaliações e uma semana de pedidos."

    def handle(self, *args, **options):
        rng = random.Random()

        novos = 0
        for cat, nome, desc, preco, emoji in PRODUTOS_EXTRAS:
            _, criado = Produto.objects.get_or_create(
                nome=nome,
                defaults={"categoria": cat, "descricao": desc, "preco": preco, "emoji": emoji},
            )
            novos += criado
        self.stdout.write(f"Produtos novos: {novos}")

        novas = 0
        for titulo, texto, emoji in POSTAGENS_EXTRAS:
            _, criada = Postagem.objects.get_or_create(
                titulo=titulo, defaults={"texto": texto, "emoji": emoji}
            )
            novas += criada
        self.stdout.write(f"Postagens novas: {novas}")

        # avaliações pra produtos que ainda não têm nenhuma
        sem_avaliacao = Produto.objects.filter(avaliacoes__isnull=True)
        for produto in sem_avaliacao:
            for _ in range(rng.randint(4, 15)):
                Avaliacao.objects.create(
                    produto=produto, nota=rng.choices([3, 4, 5], weights=[1, 3, 6])[0]
                )
        self.stdout.write(f"Avaliações criadas pra {sem_avaliacao.count()} produtos.")

        # uma semana de movimento: pedidos com horários espalhados e populares definidos
        produtos = list(Produto.objects.filter(ativo=True))
        pesos = {p.id: rng.randint(1, 10) for p in produtos}
        agora = timezone.now()
        criados = 0
        for _ in range(45):
            momento = agora - timedelta(minutes=rng.randint(0, 7 * 24 * 60))
            pedido = Pedido.objects.create(mesa=rng.randint(1, 12))
            escolhidos = set()
            total = 0
            for _ in range(rng.randint(1, 4)):
                produto = rng.choices(produtos, weights=[pesos[p.id] for p in produtos])[0]
                if produto.id in escolhidos:
                    continue
                escolhidos.add(produto.id)
                qtd = rng.randint(1, 3)
                ItemPedido.objects.create(
                    pedido=pedido, produto=produto, quantidade=qtd, preco_unitario=produto.preco
                )
                total += produto.preco * qtd
            idade_horas = (agora - momento).total_seconds() / 3600
            status = "entregue" if idade_horas > 1 else rng.choice(["preparando", "pronto", "entregue"])
            pedido.total = total
            pedido.status = status
            pedido.save(update_fields=["total", "status"])
            # criado_em é auto_now_add; só dá pra retroagir via update
            Pedido.objects.filter(pk=pedido.pk).update(criado_em=momento)
            criados += 1
        self.stdout.write(self.style.SUCCESS(f"{criados} pedidos criados na última semana."))
