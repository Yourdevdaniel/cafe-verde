from django.contrib import admin

from .models import ItemPedido, Pedido, Postagem, Produto


class ItemInline(admin.TabularInline):
    model = ItemPedido
    extra = 0


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "mesa", "status", "total", "criado_em"]
    list_filter = ["status"]
    inlines = [ItemInline]


admin.site.register(Produto)
admin.site.register(Postagem)
