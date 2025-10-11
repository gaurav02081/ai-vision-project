from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from apps.demos.views import DemoSessionViewSet
from apps.processing.views import ProcessingViewSet

router = DefaultRouter()
router.register(r'demo-sessions', DemoSessionViewSet, basename='demo-sessions')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/processing/', include('apps.processing.urls')),
]

# static media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
