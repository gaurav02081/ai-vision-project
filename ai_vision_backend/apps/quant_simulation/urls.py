from django.urls import path
from .views import SimulationViewSet

urlpatterns = [
    path('csv_simulate/', SimulationViewSet.as_view({'post': 'csv_simulate'})),
    path('run/', SimulationViewSet.as_view({'post': 'run'})),
    path('probabilities/', SimulationViewSet.as_view({'post': 'probabilities'})),
    path('sensitivity/', SimulationViewSet.as_view({'post': 'sensitivity'})),
    path('paths3d/', SimulationViewSet.as_view({'post': 'paths3d'})),
]
