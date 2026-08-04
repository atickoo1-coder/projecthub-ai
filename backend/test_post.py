import requests

url = "http://127.0.0.1:8000/api/auth/login"
data = {
    "username": "admin@college.edu",
    "password": "password123"
}

res = requests.post(url, data=data)
print(f"Status Code: {res.status_code}")
print(f"Response: {res.text}")
