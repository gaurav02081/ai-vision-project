import requests
url='http://127.0.0.1:8000/api/v1/processing/object_detection/'
resp=requests.post(url,json={'session_id':'invalid','confidence':0.25})
print(resp.status_code)
print(resp.text)
