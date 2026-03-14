from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from django.views.decorators.http import require_http_methods
import os

def serve_media_file(request, path):
    """Serve media files with proper CORS headers"""
    # Handle OPTIONS preflight request
    if request.method == 'OPTIONS':
        from django.http import HttpResponse
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        response['Access-Control-Allow-Headers'] = '*'
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Security: Ensure the file is within MEDIA_ROOT
    file_path = os.path.normpath(file_path)
    media_root = os.path.normpath(settings.MEDIA_ROOT)
    if not file_path.startswith(media_root):
        raise Http404("File not found")
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        try:
            file_handle = open(file_path, 'rb')
            response = FileResponse(file_handle)
            
            # Set content type based on file extension
            if file_path.lower().endswith('.jpg') or file_path.lower().endswith('.jpeg'):
                response['Content-Type'] = 'image/jpeg'
            elif file_path.lower().endswith('.png'):
                response['Content-Type'] = 'image/png'
            elif file_path.lower().endswith('.gif'):
                response['Content-Type'] = 'image/gif'
            else:
                response['Content-Type'] = 'application/octet-stream'
            
            # Add CORS headers
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = '*'
            response['Access-Control-Max-Age'] = '86400'
            
            return response
        except Exception as e:
            raise Http404("File not found")
    
    raise Http404("File not found")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/processing/', include('apps.processing.urls')),
    path('api/simulation/', include('apps.quant_simulation.urls')),
    # Custom media file serving with CORS support
    path('media/<path:path>', serve_media_file, name='media'),
]

# static media (for development when DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
