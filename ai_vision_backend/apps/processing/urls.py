from django.urls import path  # pyright: ignore[reportMissingImports]
from .views import ProcessingViewSet

urlpatterns = [
    # Direct processing endpoints (no session required)
    path('direct_object_detection/', ProcessingViewSet.as_view({'post': 'direct_object_detection'})),
    path('direct_image_segmentation/', ProcessingViewSet.as_view({'post': 'direct_image_segmentation'})),
    # Real-time facial recognition endpoints
    path('register_face/', ProcessingViewSet.as_view({'post': 'register_face'})),
    path('recognize_frame/', ProcessingViewSet.as_view({'post': 'recognize_frame'})),
    # Real-time gesture control endpoints
    path('process_gesture_frame/', ProcessingViewSet.as_view({'post': 'process_gesture_frame'})),
    path('get_gesture_info/', ProcessingViewSet.as_view({'get': 'get_gesture_info'})),
    # Chatbot endpoint
    path('chatbot/', ProcessingViewSet.as_view({'post': 'chatbot'})),
]
