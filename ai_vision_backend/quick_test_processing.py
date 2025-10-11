import requests

URL = 'http://127.0.0.1:8000/api/v1/processing/object_detection/'
try:
    r = requests.post(URL, json={})
    print('status', r.status_code)
    print('text:', r.text)
except Exception as e:
    print('error', e)
