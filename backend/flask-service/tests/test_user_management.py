import unittest
from datetime import datetime, timedelta
from flask import json, current_app
from src import create_app
from src.models.user import User
from src.models import db
from src.utils.responses import TestConfig
from src.utils.database import generate_token, verify_token

class TestUserManagement(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_registration(self):
        """Test user registration endpoint"""
        response = self.client.post('/api/users/register', json={
            'email': 'test@example.com',
            'password': 'Test123!',
            'name': 'Test User'
        })
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('user_id', data)
        self.assertEqual(data['email'], 'test@example.com')

    def test_user_login(self):
        """Test user login endpoint"""
        # Create a test user
        self.client.post('/api/users/register', json={
            'email': 'test@example.com',
            'password': 'Test123!',
            'name': 'Test User'
        })

        # Test login
        response = self.client.post('/api/users/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('token', data)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/users/login', json={
            'email': 'nonexistent@example.com',
            'password': 'wrong'
        })
        self.assertEqual(response.status_code, 401)

    def test_get_user_profile(self):
        """Test getting user profile"""
        # Register and login
        self.client.post('/api/users/register', json={
            'email': 'test@example.com',
            'password': 'Test123!',
            'name': 'Test User'
        })
        login_response = self.client.post('/api/users/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        token = json.loads(login_response.data)['token']

        # Get profile
        response = self.client.get('/api/users/profile', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['email'], 'test@example.com')

if __name__ == '__main__':
    unittest.main() 