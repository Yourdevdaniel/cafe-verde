from rest_framework import serializers

from .models import TOTAL_MESAS, ItemPedido, Pedido, Postagem, Produto


class ProdutoSerializer(serializers.ModelSerializer):
    # vêm de annotations do queryset; ausentes em instâncias avulsas (ex.: após create)
    nota_media = serializers.SerializerMethodField()
    num_avaliacoes = serializers.SerializerMethodField()
    vendidos_semana = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = [
            "id", "categoria", "nome", "descricao", "preco", "emoji", "imagem",
            "destaque", "ativo", "nota_media", "num_avaliacoes", "vendidos_semana",
        ]

    def get_nota_media(self, obj):
        media = getattr(obj, "nota_media", None)
        return round(media, 1) if media is not None else None

    def get_num_avaliacoes(self, obj):
        return getattr(obj, "num_avaliacoes", 0)

    def get_vendidos_semana(self, obj):
        return getattr(obj, "vendidos_semana", 0)


class PostagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postagem
        fields = ["id", "titulo", "texto", "emoji", "publicado", "criado_em"]


class ItemPedidoSerializer(serializers.ModelSerializer):
    produto = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.filter(ativo=True)
    )
    nome = serializers.CharField(source="produto.nome", read_only=True)
    emoji = serializers.CharField(source="produto.emoji", read_only=True)

    class Meta:
        model = ItemPedido
        fields = ["produto", "nome", "emoji", "quantidade", "preco_unitario"]
        read_only_fields = ["preco_unitario"]

    def validate_quantidade(self, valor):
        if not 1 <= valor <= 50:
            raise serializers.ValidationError("Quantidade deve ser entre 1 e 50.")
        return valor


class PedidoSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ["id", "mesa", "status", "total", "criado_em", "itens"]
        read_only_fields = ["status", "total", "criado_em"]

    def validate_mesa(self, valor):
        if not 1 <= valor <= TOTAL_MESAS:
            raise serializers.ValidationError(f"Mesa deve ser entre 1 e {TOTAL_MESAS}.")
        return valor

    def validate_itens(self, itens):
        if not itens:
            raise serializers.ValidationError("O pedido precisa de pelo menos um item.")
        return itens

    def create(self, validated_data):
        itens = validated_data.pop("itens")
        pedido = Pedido.objects.create(**validated_data)
        total = 0
        for item in itens:
            produto = item["produto"]
            # preço vem SEMPRE do banco, nunca do cliente
            ItemPedido.objects.create(
                pedido=pedido,
                produto=produto,
                quantidade=item["quantidade"],
                preco_unitario=produto.preco,
            )
            total += produto.preco * item["quantidade"]
        pedido.total = total
        pedido.save(update_fields=["total"])
        return pedido
