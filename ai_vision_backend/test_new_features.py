#!/usr/bin/env python3
"""
Test script for the new AI vision features.
Run this script to test the facial recognition, gesture control, and image segmentation services.
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_vision_backend.settings')
django.setup()

def test_facial_recognition():
    """Test facial recognition service"""
    print("Testing Facial Recognition Service...")
    try:
        from apps.processing.services.facial_recognition_service import FacialRecognitionService
        service = FacialRecognitionService()
        print("✓ Facial Recognition Service initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Facial Recognition Service failed: {e}")
        return False

def test_gesture_control():
    """Test gesture control service"""
    print("Testing Gesture Control Service...")
    try:
        from apps.processing.services.gesture_control_service import GestureControlService
        service = GestureControlService()
        print("✓ Gesture Control Service initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Gesture Control Service failed: {e}")
        return False

def test_image_segmentation():
    """Test image segmentation service"""
    print("Testing Image Segmentation Service...")
    try:
        from apps.processing.services.image_segmentation_service import ImageSegmentationService
        service = ImageSegmentationService()
        print("✓ Image Segmentation Service initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Image Segmentation Service failed: {e}")
        return False

def test_models():
    """Test Django models"""
    print("Testing Django Models...")
    try:
        from apps.processing.models import FacialRecognition, GestureControl, ImageSegmentation
        from apps.demos.models import DemoSession
        
        # Test model creation (without saving)
        session = DemoSession(demo_type='facial_recognition')
        facial_rec = FacialRecognition(session=session, name="Test Person")
        gesture_rec = GestureControl(session=session)
        seg_rec = ImageSegmentation(session=session)
        
        print("✓ All models created successfully")
        return True
    except Exception as e:
        print(f"✗ Model creation failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoint availability"""
    print("Testing API Endpoints...")
    try:
        from apps.processing.views import ProcessingViewSet
        
        # Check if the view methods exist
        viewset = ProcessingViewSet()
        methods = ['facial_recognition', 'gesture_recognition', 'image_segmentation']
        
        for method in methods:
            if hasattr(viewset, method):
                print(f"✓ {method} endpoint available")
            else:
                print(f"✗ {method} endpoint missing")
                return False
        
        return True
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("AI Vision Lab - New Features Test")
    print("=" * 50)
    
    tests = [
        test_models,
        test_facial_recognition,
        test_gesture_control,
        test_image_segmentation,
        test_api_endpoints
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The new features are ready to use.")
        print("\nNext steps:")
        print("1. Set up your GEMINI_API_KEY in environment variables")
        print("2. Start the Django server: python manage.py runserver")
        print("3. Test the API endpoints with your frontend")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
