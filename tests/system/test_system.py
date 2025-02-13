import requests
import time
import subprocess
import sys
import psycopg2
from datetime import datetime
import os

class SystemTester:
    def __init__(self, base_url=None):
        # Get port from environment or use default
        port = os.getenv('FLASK_PORT', '8000')
        self.base_url = base_url or f"http://localhost:{port}"
        self.access_token = None
        self.test_user = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "test_password",
            "name": "Test User"
        }

    def run_all_tests(self):
        try:
            self.test_database_connection()
            self.test_user_registration()
            self.test_login()
            self.test_preferences()
            print("\n✅ All tests passed successfully!")
        except Exception as e:
            print(f"\n❌ Test failed: {str(e)}")
            sys.exit(1)

    def test_database_connection(self):
        print("\nTesting database connection...")
        max_retries = 5
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                conn = psycopg2.connect(
                    dbname="gatherup",
                    user="gatherup",
                    password="gatherup",
                    host="localhost",
                    port="5432"
                )
                conn.close()
                print("✅ Database connection successful")
                return
            except psycopg2.OperationalError:
                retry_count += 1
                if retry_count < max_retries:
                    print(f"Retrying database connection ({retry_count}/{max_retries})...")
                    time.sleep(2)
                else:
                    raise Exception("Could not connect to database")

    def test_user_registration(self):
        print("\nTesting user registration...")
        # Implementation will go here once we have the registration endpoint
        print("⚠️ User registration test skipped - endpoint not implemented yet")

    def test_login(self):
        print("\nTesting login...")
        response = requests.post(
            f"{self.base_url}/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.json()}")
        
        self.access_token = response.json()['access_token']
        print("✅ Login successful")

    def test_preferences(self):
        print("\nTesting preferences...")
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        # Test GET preferences
        response = requests.get(f"{self.base_url}/api/preferences", headers=headers)
        if response.status_code != 200:
            raise Exception(f"GET preferences failed: {response.json()}")
        print("✅ GET preferences successful")

        # Test PUT preferences
        new_preferences = {
            "categories": ["sports", "music"],
            "max_distance": 15.0
        }
        response = requests.put(
            f"{self.base_url}/api/preferences",
            headers=headers,
            json=new_preferences
        )
        if response.status_code != 200:
            raise Exception(f"PUT preferences failed: {response.json()}")
        
        # Verify updated preferences
        response = requests.get(f"{self.base_url}/api/preferences", headers=headers)
        if response.json()['categories'] != new_preferences['categories'] or \
           response.json()['max_distance'] != new_preferences['max_distance']:
            raise Exception("Preferences were not updated correctly")
        
        print("✅ PUT preferences successful")

def main():
    print("Starting system tests...")
    
    # Check if Docker containers are running
    try:
        subprocess.run(
            ["docker-compose", "ps"],
            check=True,
            capture_output=True
        )
    except subprocess.CalledProcessError:
        print("❌ Docker containers are not running")
        sys.exit(1)

    # Run the tests
    tester = SystemTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 