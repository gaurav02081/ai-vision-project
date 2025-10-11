import requests
BASE='http://127.0.0.1:8000'
IMG=r'E:\AI VISION LAB\ai\public\obb_ttest.jpeg'

r=requests.post(BASE+'/api/v1/demos/', data={'demo_type':'object_detection'})
print('create', r.status_code, r.text)
js=r.json()
pk=js['id']
sess=js['session_id']
with open(IMG,'rb') as f:
    r2=requests.post(BASE+f'/api/v1/demos/{pk}/upload_file/', files={'file':('obb_ttest.jpeg', f,'image/jpeg')})
    print('upload', r2.status_code, r2.text)

r3=requests.post(BASE+'/api/v1/processing/object_detection/', json={'session_id':sess,'confidence':0.25})
print('process', r3.status_code, r3.text)
