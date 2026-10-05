import os
import random

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand

from core.models import Avaliacao, Postagem, Produto

PRODUTOS = [
    ("Cafés", "Espresso", "Dose intensa de café 100% arábica, torra média.", "7.00", "☕"),
    ("Cafés", "Cappuccino Cremoso", "Espresso, leite vaporizado e espuma aveludada com canela.", "12.50", "🍵"),
    ("Cafés", "Latte Caramelo", "Café suave com leite e calda artesanal de caramelo.", "14.00", "🥛"),
    ("Cafés", "Mocha", "Espresso com chocolate belga meio amargo e chantilly.", "15.00", "🍫"),
    ("Cafés", "Café Coado da Casa", "Método coado no filtro de pano, grão do dia.", "8.50", "🫖"),
    ("Bebidas Geladas", "Iced Latte", "Espresso duplo, leite gelado e gelo. Refrescante.", "13.50", "🧊"),
    ("Bebidas Geladas", "Frappuccino", "Café batido com gelo, leite condensado e chantilly.", "16.00", "🥤"),
    ("Bebidas Geladas", "Suco Verde", "Couve, limão, maçã e gengibre. Prensado na hora.", "11.00", "🥬"),
    ("Bebidas Geladas", "Chocolate Gelado", "Chocolate 70% batido com leite e gelo.", "12.00", "🍦"),
    ("Salgados", "Pão de Queijo", "Receita mineira, assado na hora. Unidade grande.", "6.50", "🧀"),
    ("Salgados", "Croissant de Presunto e Queijo", "Massa folhada amanteigada, recheio generoso.", "14.50", "🥐"),
    ("Salgados", "Tostado na Chapa", "Pão de fermentação natural, queijo e tomate.", "15.00", "🥪"),
    ("Salgados", "Empada de Frango", "Massa que derrete na boca, frango com catupiry.", "9.00", "🥧"),
    ("Doces", "Bolo de Cenoura", "Com cobertura cremosa de chocolate. Fatia farta.", "10.50", "🍰"),
    ("Doces", "Brownie com Nozes", "Chocolate intenso, casquinha crocante, centro úmido.", "11.00", "🍩"),
    ("Doces", "Torta de Limão", "Base de biscoito, creme azedinho e merengue maçaricado.", "12.00", "🍋"),
    ("Doces", "Cookie de Chocolate", "Gotas de chocolate belga, assado no dia.", "8.00", "🍪"),
    ("Combos", "Combo da Manhã", "Café coado + pão de queijo + suco de laranja.", "19.90", "🌅"),
    ("Combos", "Combo da Tarde", "Cappuccino + fatia de bolo de cenoura.", "21.90", "🌇"),
    ("Combos", "Combo Duplo", "2 lattes + 2 cookies. Perfeito pra dividir.", "34.90", "💑"),
]

IMAGENS = {
    "Espresso": "/img/espresso.jpg",
    "Cappuccino Cremoso": "/img/cappuccino.jpg",
    "Latte Caramelo": "/img/latte-caramelo.jpg",
    "Mocha": "/img/mocha.jpg",
    "Café Coado da Casa": "/img/coado.jpg",
    "Iced Latte": "/img/iced-latte.jpg",
    "Frappuccino": "/img/frappuccino.jpg",
    "Suco Verde": "/img/suco-verde.jpg",
    "Chocolate Gelado": "/img/chocolate-gelado.jpg",
    "Pão de Queijo": "/img/pao-de-queijo.jpg",
    "Croissant de Presunto e Queijo": "/img/croissant.jpg",
    "Tostado na Chapa": "/img/tostado.jpg",
    "Empada de Frango": "/img/empada.jpg",
    "Bolo de Cenoura": "/img/bolo-cenoura.jpg",
    "Brownie com Nozes": "/img/brownie.jpg",
    "Torta de Limão": "/img/torta-limao.jpg",
    "Cookie de Chocolate": "/img/cookie.jpg",
    "Combo da Manhã": "/img/combo-manha.jpg",
    "Combo da Tarde": "/img/combo-tarde.jpg",
    "Combo Duplo": "/img/combo-duplo.jpg",
}

POSTAGENS = [
    ("Novo grão da estação chegou!", "Recebemos um lote especial do Cerrado Mineiro, com notas de chocolate e caramelo. Torra feita aqui na casa, disponível no coado e no espresso a partir desta semana.", "🌱"),
    ("Música ao vivo toda sexta", "A partir deste mês, toda sexta-feira às 19h temos voz e violão no salão. Entrada gratuita — chegue cedo pra garantir sua mesa.", "🎶"),
    ("Croissants agora saem de hora em hora", "Nossa padaria interna cresceu! Agora os croissants saem quentinhos do forno de hora em hora, das 8h às 18h.", "🥐"),
    ("Traga seu copo e ganhe desconto", "Traga seu copo reutilizável e ganhe 10% de desconto em qualquer bebida. A borra do nosso café vira adubo na horta comunitária do bairro.", "♻️"),
]


class Command(BaseCommand):
    help = "Popula cardápio, postagens e usuários iniciais (idempotente)."

    def handle(self, *args, **options):
        if not Produto.objects.exists():
            for cat, nome, desc, preco, emoji in PRODUTOS:
                Produto.objects.create(
                    categoria=cat, nome=nome, descricao=desc, preco=preco, emoji=emoji
                )
            self.stdout.write(f"Cardápio criado ({len(PRODUTOS)} produtos).")

        # preenche fotos de produtos que ainda não têm (idempotente)
        for nome, img in IMAGENS.items():
            Produto.objects.filter(nome=nome, imagem="").update(imagem=img)

        # marca os destaques da casa só na primeira vez (admin pode mudar depois)
        if not Produto.objects.filter(destaque=True).exists():
            Produto.objects.filter(
                nome__in=[
                    "Cappuccino Cremoso",
                    "Frappuccino",
                    "Pão de Queijo",
                    "Croissant de Presunto e Queijo",
                    "Bolo de Cenoura",
                    "Combo da Manhã",
                ]
            ).update(destaque=True)

        if not Postagem.objects.exists():
            for titulo, texto, emoji in POSTAGENS:
                Postagem.objects.create(titulo=titulo, texto=texto, emoji=emoji)
            self.stdout.write(f"Postagens criadas ({len(POSTAGENS)}).")

        # avaliações iniciais pra vitrine não nascer vazia
        if not Avaliacao.objects.exists():
            rng = random.Random(42)
            for produto in Produto.objects.all():
                for _ in range(rng.randint(4, 15)):
                    Avaliacao.objects.create(
                        produto=produto, nota=rng.choices([3, 4, 5], weights=[1, 3, 6])[0]
                    )
            self.stdout.write("Avaliações iniciais criadas.")

        usuarios = [
            ("admin", os.environ.get("ADMIN_PASSWORD", "admin123"), None, True),
            ("cozinha", os.environ.get("COZINHA_PASSWORD", "cozinha123"), "cozinha", False),
            ("garcom", os.environ.get("GARCOM_PASSWORD", "garcom123"), "garcom", False),
        ]
        for username, senha, grupo, staff in usuarios:
            if User.objects.filter(username=username).exists():
                continue
            user = User.objects.create_user(username=username, password=senha)
            user.is_staff = staff
            user.is_superuser = staff
            user.save()
            if grupo:
                g, _ = Group.objects.get_or_create(name=grupo)
                user.groups.add(g)
            self.stdout.write(f"Usuário '{username}' criado.")

        self.stdout.write(self.style.SUCCESS("Seed concluído."))
