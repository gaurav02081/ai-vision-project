#!/usr/bin/env python3
"""
Test script for Gemini integration
"""
import os
import sys
sys.path.append('.')

from apps.processing.services.gemini_service import GeminiService

def test_gemini_integration():
    print("🤖 Testing Gemini Integration")
    print("=" * 50)
    
    # Check if API key is set
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY environment variable not set")
        print("   Please set it with: set GEMINI_API_KEY=your_api_key_here")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    try:
        # Initialize Gemini service
        print("\n1. Initializing Gemini service...")
        gemini_service = GeminiService()
        print("✅ Gemini service initialized successfully")
        
        # Test description generation
        print("\n2. Testing description generation...")
        test_detections = [
            {"class": "person", "confidence": 0.95},
            {"class": "car", "confidence": 0.87},
            {"class": "dog", "confidence": 0.73}
        ]
        
        description = gemini_service.generate_description(test_detections, 'object_detection')
        print(f"✅ Generated description: {description}")
        
        # Test technical summary
        print("\n3. Testing technical summary...")
        technical_summary = gemini_service.generate_technical_summary(test_detections, 0.5, 'yolov8')
        print(f"✅ Generated technical summary: {technical_summary}")
        
        print("\n🎉 Gemini integration is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Gemini test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_gemini_integration()
