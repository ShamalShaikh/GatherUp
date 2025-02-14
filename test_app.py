from core.app import create_app

app = create_app('testing')

def test_hello_world():
    client = app.test_client()
    response = client.get('/')
    assert response.status_code == 200
    assert response.data == b'Hello, World!'
