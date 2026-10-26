from django.contrib import admin
from .models import *


admin.site.register(Note)
admin.site.register(OfficeEnrollRequests)
admin.site.register(Office)


class HouseFileInline(admin.TabularInline):
    model = HouseFile
    extra = 2


@admin.register(House)
class HouseAdmin(admin.ModelAdmin):

    inlines = [HouseFileInline]

    list_display = (
        "id",
        "office",
        "listing_type",
        "price",
        "status",
    )

    list_filter = (
        "listing_type",
        "status",
        "office",
    )

    search_fields = (
        "description",
        "location",
        "office__username",
    )


@admin.register(HouseFile)
class HouseFileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "house",
        "file",
    )

class OfficeDealAdmin(admin.ModelAdmin):
    model = OfficeDeal
  

admin.site.register(OfficeDeal, OfficeDealAdmin)