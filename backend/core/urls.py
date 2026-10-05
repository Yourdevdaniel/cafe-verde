from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("produtos", views.ProdutoViewSet, basename="produto")
router.register("postagens", views.PostagemViewSet, basename="postagem")
router.register("pedidos", views.PedidoViewSet, basename="pedido")

urlpatterns = [
    path("", include(router.urls)),
    path("token/", views.LoginThrottled.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("me/", views.me),
]
