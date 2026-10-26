from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection, DatabaseError
from django.views.decorators.http import require_GET
import logging
from . import settings
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic.base import RedirectView


logger = logging.getLogger(__name__)


@require_GET
def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        logger.exception("Health check could not connect to the database")
        return JsonResponse({"status": "error", "database": "unavailable"}, status=503)

    return JsonResponse({"status": "ok", "database": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name="health_check"),
    path('', include('authentications.urls')),
    path('', include('office.urls')),
    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('logo.png'))),
]


if settings.DEBUG:
    urlpatterns += [
                # api documentations
            path('api/schema/', SpectacularAPIView.as_view(), name="schema"), # download schema raw file(json or yaml)

            # interactive ui views
            path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
            path('api/docs/redoc/', SpectacularRedocView.as_view(url_name="schema"), name="redoc")
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
