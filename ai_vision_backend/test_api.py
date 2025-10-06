import requests
import time

BASE = 'http://127.0.0.1:8000'
IMG_PATH = r'E:\AI VISION LAB\ai\public\obb_ttest.jpeg'

def create_demo():
    url = BASE + '/api/v1/demos/'
    # send as form data because the view uses MultiPartParser/FormParser
    r = requests.post(url, data={'demo_type': 'object_detection'})
    print('create_demo status', r.status_code)
    print(r.text)
    return r.json()

def upload_file(demo_id):
    url = BASE + f'/api/v1/demos/{demo_id}/upload_file/'
    with open(IMG_PATH, 'rb') as f:
        files = {'file': ('obb_ttest.jpeg', f, 'image/jpeg')}
        r = requests.post(url, files=files)
    print('upload_file status', r.status_code)
    print(r.text)
    return r.json()

def run_detection(session_id):
    url = BASE + '/api/v1/processing/object_detection/'
    # pass confidence threshold (lowered to 0.25 for demo)
    r = requests.post(url, json={'session_id': session_id, 'confidence': 0.25})
    print('run_detection status', r.status_code)
    print(r.text)
    return r.json()

if __name__ == '__main__':
    # wait a little for server to start
    time.sleep(2)
    demo = create_demo()
    demo_id = demo.get('id')
    session_id = demo.get('session_id')
    if demo_id:
        upload_file(demo_id)
        # give server a second
        time.sleep(1)
        run_detection(session_id)
    else:
        print('Failed to create demo session')
