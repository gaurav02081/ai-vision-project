from django.db import models
import uuid

class DemoSession(models.Model):
    session_id = models.UUIDField(unique=True, default=uuid.uuid4)
    demo_type = models.CharField(
        max_length=30,
        choices=[
            ('object_detection', 'Object Detection'),
            ('facial_recognition', 'Facial Recognition'),
            ('gesture_control', 'Gesture Control'),
            ('image_segmentation', 'Image Segmentation')
        ]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('uploading', 'Uploading'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='uploading'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.demo_type} - {self.session_id}"

class DemoFile(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    file_type = models.CharField(max_length=10)  # 'image', 'video'
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # in bytes
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.file_size > 50 * 1024 * 1024:  # 50MB limit
            raise ValidationError("File size must be less than 50MB")

    def __str__(self):
        return f"{self.original_filename} - {self.session.session_id}"
