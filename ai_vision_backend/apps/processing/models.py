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
