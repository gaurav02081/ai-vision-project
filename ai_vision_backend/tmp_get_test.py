import requests
s='652744d2-90ed-42de-a259-5ecd19d4eac0'
print('GET test for', s)
r=requests.get('http://127.0.0.1:8000/api/v1/processing/object_detection/', params={'session_id':s})
print(r.status_code)
print(r.text)
