import unittest
from datetime import datetime, timedelta
from flask import json, current_app
from src import create_app
from src.models.user import User
from src.models.meeting import Meeting
from src.models.meeting_participant import MeetingParticipant
from src.models import db
from src.utils.responses import TestConfig
from src.utils.database import generate_token
from src.utils.socket_events import generate_meeting_code

class TestMeeting(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Create test user and get token
        response = self.client.post('/api/users/register', json={
            'email': 'test@example.com',
            'password': 'Test123!',
            'name': 'Test User'
        })
        login_response = self.client.post('/api/users/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        self.token = json.loads(login_response.data)['token']
        self.headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_create_meeting(self):
        """Test meeting creation"""
        response = self.client.post('/api/meetings/create', 
            headers=self.headers,
            json={
                'title': 'Test Meeting',
                'description': 'Test Description',
                'scheduled_time': '2024-01-01T10:00:00Z'
            }
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('meeting_id', data)
        self.assertIn('meeting_code', data)

    def test_join_meeting(self):
        """Test joining a meeting"""
        # Create a meeting first
        create_response = self.client.post('/api/meetings/create',
            headers=self.headers,
            json={
                'title': 'Test Meeting',
                'description': 'Test Description',
                'scheduled_time': '2024-01-01T10:00:00Z'
            }
        )
        meeting_code = json.loads(create_response.data)['meeting_code']

        # Test joining the meeting
        response = self.client.post(f'/api/meetings/join/{meeting_code}',
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('meeting_details', data)

    def test_list_meetings(self):
        """Test listing user's meetings"""
        # Create multiple meetings
        for i in range(3):
            self.client.post('/api/meetings/create',
                headers=self.headers,
                json={
                    'title': f'Test Meeting {i}',
                    'description': f'Test Description {i}',
                    'scheduled_time': '2024-01-01T10:00:00Z'
                }
            )

        # Get list of meetings
        response = self.client.get('/api/meetings/list',
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['meetings']), 3)

    def test_invalid_meeting_code(self):
        """Test joining with invalid meeting code"""
        response = self.client.post('/api/meetings/join/invalid_code',
            headers=self.headers
        )
        self.assertEqual(response.status_code, 404)

    def test_meeting_details(self):
        """Test getting meeting details"""
        # Create a meeting
        create_response = self.client.post('/api/meetings/create',
            headers=self.headers,
            json={
                'title': 'Test Meeting',
                'description': 'Test Description',
                'scheduled_time': '2024-01-01T10:00:00Z'
            }
        )
        meeting_id = json.loads(create_response.data)['meeting_id']

        # Get meeting details
        response = self.client.get(f'/api/meetings/{meeting_id}',
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Meeting')
        self.assertEqual(data['description'], 'Test Description')

if __name__ == '__main__':
    unittest.main() 