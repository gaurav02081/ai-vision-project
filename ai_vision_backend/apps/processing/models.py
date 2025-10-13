from django.db import models
from apps.demos.models import DemoSession

class ProcessingResult(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE)
    result_type = models.CharField(max_length=30)
    result_file = models.FileField(upload_to='results/%Y/%m/%d/', null=True, blank=True)
    result_data = models.JSONField()
    processing_time = models.FloatField()
    model_used = models.CharField(max_length=50)
    confidence_threshold = models.FloatField(default=0.5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.session.demo_type} - {self.result_type}"

class FacialRecognition(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    input_image = models.ImageField(upload_to='facial_input/')
    result_image = models.ImageField(upload_to='facial_output/', null=True, blank=True)
    recognized = models.BooleanField(default=False)
    confidence = models.FloatField(default=0.0)
    ai_description = models.TextField(blank=True)
    technical_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Facial Recognition - {self.name}"

class GestureControl(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE)
    input_image = models.FileField(upload_to='gesture_input/')
    result_image = models.ImageField(upload_to='gesture_output/', null=True, blank=True)
    landmarks = models.JSONField(default=list)  # Store pose landmarks as JSON
    ai_description = models.TextField(blank=True)
    technical_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Gesture Control - {self.session.session_id}"

class ImageSegmentation(models.Model):
    session = models.ForeignKey(DemoSession, on_delete=models.CASCADE)
    input_image = models.ImageField(upload_to='segmentation_input/')
    result_image = models.ImageField(upload_to='segmentation_output/', null=True, blank=True)
    segments = models.JSONField(default=list)  # Store segmentation data as JSON
    ai_description = models.TextField(blank=True)
    technical_summary = models.TextField(blank=True)
    processing_time = models.FloatField(default=0.0)
    model_used = models.CharField(max_length=50, default='DeepLabV3+')
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Image Segmentation - {self.session.session_id}"
