from django.urls import path  # pyright: ignore[reportMissingImports]
from .views import ProcessingViewSet

urlpatterns = [
    path('object_detection/', ProcessingViewSet.as_view({'post': 'object_detection', 'get': 'object_detection'})),
    path('facial_recognition/', ProcessingViewSet.as_view({'post': 'facial_recognition'})),
    path('gesture_recognition/', ProcessingViewSet.as_view({'post': 'gesture_recognition'})),
    path('image_segmentation/', ProcessingViewSet.as_view({'post': 'image_segmentation'})),
    path('analyze_image/', ProcessingViewSet.as_view({'post': 'analyze_image'})),
]
