import os
import django
import shutil
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_vision_backend.settings')
django.setup()

from apps.demos.models import DemoSession, DemoFile
from apps.processing.services.object_detection import ObjectDetectionService
from django.core.files import File

BASE_DIR = Path(__file__).resolve().parent
MEDIA_ROOT = BASE_DIR / 'media'
UPLOAD_DIR = MEDIA_ROOT / 'uploads' / 'test'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

SRC_IMG = Path(r'E:\AI VISION LAB\ai\public\obb_ttest.jpeg')
DST_IMG = UPLOAD_DIR / 'obb_ttest.jpeg'
shutil.copyfile(SRC_IMG, DST_IMG)

# create session
session = DemoSession.objects.create(demo_type='object_detection')
print('Created DemoSession:', session.session_id)

# create DemoFile pointing to copied file
rel_name = os.path.relpath(DST_IMG, MEDIA_ROOT)
with open(DST_IMG, 'rb') as f:
    django_file = File(f)
    demo_file = DemoFile()
    demo_file.session = session
    demo_file.file.save(rel_name.replace('\\', '/'), django_file, save=True)
    demo_file.file_type = 'image'
    demo_file.original_filename = SRC_IMG.name
    demo_file.file_size = DST_IMG.stat().st_size
    demo_file.mime_type = 'image/jpeg'
    demo_file.save()

print('Created DemoFile:', demo_file.file.path)

# run detection
svc = ObjectDetectionService()
print('Model loaded:', bool(svc.model))
detections = svc.process_image(demo_file.file.path)
print('Detections:', detections)

# store ProcessingResult
from apps.processing.models import ProcessingResult
result = ProcessingResult.objects.create(
    session=session,
    result_type='object_detection',
    result_data={'detections': detections},
    processing_time=0.5,
    model_used='yolov8'
)
print('Saved ProcessingResult id:', result.id)
