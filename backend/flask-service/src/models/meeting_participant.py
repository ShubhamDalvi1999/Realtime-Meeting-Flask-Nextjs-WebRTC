from datetime import datetime, UTC
from .. import db

class MeetingParticipant(db.Model):
    __tablename__ = 'meeting_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, declined, banned
    role = db.Column(db.String(20), nullable=False, default='attendee')  # attendee, presenter, moderator
    joined_at = db.Column(db.DateTime, nullable=True)
    left_at = db.Column(db.DateTime, nullable=True)
    is_banned = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Additional fields for participation tracking
    total_time = db.Column(db.Integer, nullable=True)  # Total time spent in meeting in seconds
    connection_quality = db.Column(db.Float, nullable=True)  # Average connection quality
    participation_score = db.Column(db.Float, nullable=True)  # Engagement score
    feedback = db.Column(db.Text, nullable=True)  # Participant feedback
    
    # Relationships
    user = db.relationship('User', backref=db.backref('meeting_participations', lazy=True))
    
    def __init__(self, meeting_id, user_id, status='pending', role='attendee'):
        self.meeting_id = meeting_id
        self.user_id = user_id
        self.status = status
        self.role = role
        
    def to_dict(self):
        return {
            'id': self.id,
            'meeting_id': self.meeting_id,
            'user_id': self.user_id,
            'status': self.status,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'left_at': self.left_at.isoformat() if self.left_at else None,
            'is_banned': self.is_banned,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'total_time': self.total_time,
            'connection_quality': self.connection_quality,
            'participation_score': self.participation_score,
            'feedback': self.feedback
        } 