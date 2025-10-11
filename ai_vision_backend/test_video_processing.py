#!/usr/bin/env python3
"""
Test script for video processing
"""
import requests
import os
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_video_processing_flow():
    print("🎥 Testing Video Processing Flow")
    print("=" * 50)
    
    # Step 1: Create demo session
    print("1. Creating demo session...")
    session_response = requests.post(
        f"{BASE_URL}/demo-sessions/",
        data={"demo_type": "object_detection"}
    )
    
    if session_response.status_code != 201:
        print(f"❌ Failed to create session: {session_response.status_code}")
        print(session_response.text)
        return False
    
    session_data = session_response.json()
    session_id = session_data["id"]
    session_uuid = session_data["session_id"]
    print(f"✅ Session created: ID={session_id}, UUID={session_uuid}")
    
    # Step 2: Check if we have a test video
    print("\n2. Looking for test video...")
    test_video_path = "media/uploads/test/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        print(f"❌ Test video not found: {test_video_path}")
        print("   Please add a test video file to test video processing")
        return False
    
    print(f"✅ Test video found: {test_video_path}")
    
    # Step 3: Upload test video
    print("\n3. Uploading test video...")
    with open(test_video_path, 'rb') as f:
        files = {'file': f}
        upload_response = requests.post(
            f"{BASE_URL}/demo-sessions/{session_id}/upload_file/",
            files=files
        )
    
    if upload_response.status_code != 201:
        print(f"❌ Failed to upload video: {upload_response.status_code}")
        print(upload_response.text)
        return False
    
    print("✅ Video uploaded successfully")
    
    # Step 4: Process video
    print("\n4. Processing video...")
    process_response = requests.post(
        f"{BASE_URL}/processing/object_detection/",
        json={"session_id": session_uuid, "confidence": 0.25}
    )
    
    if process_response.status_code != 200:
        print(f"❌ Failed to process video: {process_response.status_code}")
        print(process_response.text)
        return False
    
    result_data = process_response.json()
    print("✅ Video processing completed!")
    print(f"   - Total detections: {len(result_data.get('detections', []))}")
    print(f"   - AI Description: {result_data.get('ai_description', 'N/A')[:100]}...")
    print(f"   - Input URL: {result_data.get('input_image_url', 'N/A')}")
    print(f"   - Output URL: {result_data.get('output_image_url', 'N/A')}")
    
    # Step 5: Test getting results
    print("\n5. Testing result retrieval...")
    get_response = requests.get(
        f"{BASE_URL}/processing/object_detection/",
        params={"session_id": session_uuid}
    )
    
    if get_response.status_code != 200:
        print(f"❌ Failed to get results: {get_response.status_code}")
        print(get_response.text)
        return False
    
    print("✅ Results retrieved successfully")
    
    print("\n🎉 Video processing test completed successfully!")
    return True

if __name__ == "__main__":
    try:
        test_video_processing_flow()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
