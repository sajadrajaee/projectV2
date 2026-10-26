from django.urls import path
from . import views_api

app_name="office"

urlpatterns = [
    path('api/office/houses/', views_api.office_home_api),
    path('api/office/create/', views_api.create_post_api),
    path('api/office/houses/<int:id>/', views_api.update_house_api),
    path('api/office/profile/', views_api.office_profile_api),

    path('api/office/deals/', views_api.deals_api),
    path('api/office/deals/<int:id>/', views_api.deal_retrieve_api),

    path('api/houses/', views_api.get_houses),
    path('api/houses/<int:id>/', views_api.get_house_detail),
    path('api/khana/', views_api.get_khana_api),
    path('api/zamin/', views_api.get_zamin_api),
    path('api/dokan/', views_api.get_dokan_api),
    path('api/offices/', views_api.get_offices_api),
    path('api/offices/<int:id>/', views_api.get_office),
    path('api/arealist/', views_api.registered_area_api),

    path('api/houses/<str:area_name>/', views_api.get_area_houses_api),

    path('api/notes/', views_api.note_management_api),
    path('api/notes/<int:note_id>/', views_api.retrieve_note_api),

    path('api/reports/', views_api.reports_api)
]