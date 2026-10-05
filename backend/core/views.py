from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Avg, Count, OuterRef, Subquery, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from .consumers import GRUPO_PEDIDOS
from .models import Avaliacao, ItemPedido, Pedido, Postagem, Produto
from .permissions import AdminEscreveTodosLeem, SomenteFuncionario
from .serializers import PedidoSerializer, PostagemSerializer, ProdutoSerializer


def transmitir_pedido(pedido):
    async_to_sync(get_channel_layer().group_send)(
        GRUPO_PEDIDOS,
        {"type": "pedido.update", "pedido": PedidoSerializer(pedido).data},
    )


class LoginThrottled(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer
    permission_classes = [AdminEscreveTodosLeem]

    def get_queryset(self):
        u = self.request.user
        base = (
            Produto.objects.all()
            if u.is_authenticated and u.is_staff
            else Produto.objects.filter(ativo=True)
        )
        sete_dias = timezone.now() - timedelta(days=7)
        # subquery evita multiplicação de linhas ao juntar avaliações e itens
        vendidos = (
            ItemPedido.objects.filter(produto=OuterRef("pk"), pedido__criado_em__gte=sete_dias)
            .values("produto")
            .annotate(t=Sum("quantidade"))
            .values("t")
        )
        return base.annotate(
            nota_media=Avg("avaliacoes__nota"),
            num_avaliacoes=Count("avaliacoes"),
            vendidos_semana=Coalesce(Subquery(vendidos), 0),
        )

    def get_throttles(self):
        if self.action == "avaliar":
            t = ScopedRateThrottle()
            t.scope = "avaliar"
            return [t]
        return super().get_throttles()

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def avaliar(self, request, pk=None):
        try:
            nota = int(request.data.get("nota"))
        except (TypeError, ValueError):
            nota = 0
        if not 1 <= nota <= 5:
            return Response({"erro": "Nota deve ser de 1 a 5."}, status=400)
        Avaliacao.objects.create(produto=self.get_object(), nota=nota)
        return Response({"ok": True}, status=201)


class PostagemViewSet(viewsets.ModelViewSet):
    serializer_class = PostagemSerializer
    permission_classes = [AdminEscreveTodosLeem]

    def get_queryset(self):
        u = self.request.user
        if u.is_authenticated and u.is_staff:
            return Postagem.objects.all()
        return Postagem.objects.filter(publicado=True)


class PedidoViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.prefetch_related("itens__produto")

    def get_permissions(self):
        # criar: qualquer cliente na mesa; listar/mudar status: funcionário.
        # retrieve é aberto: o cliente acompanha o próprio pedido pelo id
        # (feed contém só mesa/itens/status, nada sensível).
        if self.action in ("create", "retrieve"):
            return [AllowAny()]
        return [SomenteFuncionario()]

    def get_throttles(self):
        if self.action == "create":
            t = ScopedRateThrottle()
            t.scope = "criar_pedido"
            return [t]
        return super().get_throttles()

    def perform_create(self, serializer):
        pedido = serializer.save()
        transmitir_pedido(pedido)

    @action(detail=True, methods=["patch"], permission_classes=[SomenteFuncionario])
    def status(self, request, pk=None):
        pedido = self.get_object()
        novo = request.data.get("status")
        validos = dict(Pedido.STATUS)
        if novo not in validos:
            return Response({"erro": "Status inválido."}, status=400)
        pedido.status = novo
        pedido.save(update_fields=["status"])
        transmitir_pedido(pedido)
        return Response(PedidoSerializer(pedido).data)

    @action(detail=False, permission_classes=[SomenteFuncionario])
    def resumo(self, request):
        hoje = Pedido.objects.filter(criado_em__date=timezone.localdate())
        return Response(
            {
                "pedidos_hoje": hoje.count(),
                "faturamento_hoje": sum(p.total for p in hoje),
                "na_fila": Pedido.objects.filter(status="preparando").count(),
                "prontos": Pedido.objects.filter(status="pronto").count(),
            }
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([])
def me(request):
    return Response(
        {
            "username": request.user.username,
            "is_staff": request.user.is_staff,
            "grupos": list(request.user.groups.values_list("name", flat=True)),
        }
    )
