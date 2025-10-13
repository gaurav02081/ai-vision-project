from django.urls import path  # pyright: ignore[reportMissingImports]
from .views import ProcessingViewSet

urlpatterns = [
    path('object_detection/', ProcessingViewSet.as_view({'post': 'object_detection', 'get': 'object_detection'})),
    path('facial_recognition/', ProcessingViewSet.as_view({'post': 'facial_recognition', 'get': 'facial_recognition'})),
    path('gesture_recognition/', ProcessingViewSet.as_view({'post': 'gesture_recognition', 'get': 'gesture_recognition'})),
    path('image_segmentation/', ProcessingViewSet.as_view({'post': 'image_segmentation', 'get': 'image_segmentation'})),
    path('analyze_image/', ProcessingViewSet.as_view({'post': 'analyze_image'})),
    # Direct processing endpoints (no session required)
    path('direct_object_detection/', ProcessingViewSet.as_view({'post': 'direct_object_detection'})),
    path('direct_facial_recognition/', ProcessingViewSet.as_view({'post': 'direct_facial_recognition'})),
    path('direct_gesture_recognition/', ProcessingViewSet.as_view({'post': 'direct_gesture_recognition'})),
    path('direct_image_segmentation/', ProcessingViewSet.as_view({'post': 'direct_image_segmentation'})),
    # Real-time facial recognition endpoints
    path('register_face/', ProcessingViewSet.as_view({'post': 'register_face'})),
    path('recognize_frame/', ProcessingViewSet.as_view({'post': 'recognize_frame'})),
    # Real-time gesture control endpoints
    path('process_gesture_frame/', ProcessingViewSet.as_view({'post': 'process_gesture_frame'})),
    path('get_gesture_info/', ProcessingViewSet.as_view({'get': 'get_gesture_info'})),
]
