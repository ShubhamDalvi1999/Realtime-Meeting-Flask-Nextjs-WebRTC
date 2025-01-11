from datetime import datetime, UTC, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.hybrid import hybrid_property
from .. import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Security fields
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_email_verified = db.Column(db.Boolean, nullable=False, default=False)
    email_verification_token = db.Column(db.String(100), unique=True, nullable=True)
    email_verification_sent_at = db.Column(db.DateTime, nullable=True)
    
    # Password reset fields
    password_reset_token = db.Column(db.String(100), unique=True, nullable=True)
    password_reset_sent_at = db.Column(db.DateTime, nullable=True)
    last_password_change = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    
    # Login tracking
    last_login_at = db.Column(db.DateTime, nullable=True)
    last_login_ip = db.Column(db.String(45), nullable=True)  # IPv6 length
    login_count = db.Column(db.Integer, nullable=False, default=0)
    
    # Account security
    failed_login_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    def __init__(self, email, name, password):
        self.email = email.lower().strip()
        self.name = name.strip()
        self.set_password(password)
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)
        self.last_password_change = datetime.now(UTC)

    def set_password(self, password):
        if not password or len(password) > 72:  # bcrypt limit
            raise ValueError("Invalid password length")
        self.password_hash = generate_password_hash(password)
        self.last_password_change = datetime.now(UTC)

    def check_password(self, password):
        if not password or len(password) > 72:
            return False
        return check_password_hash(self.password_hash, password)

    @hybrid_property
    def is_locked(self):
        if not self.locked_until:
            return False
        return self.locked_until > datetime.now(UTC)

    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.now(UTC) + timedelta(minutes=15)
        db.session.commit()

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        db.session.commit()

    def record_login(self, ip_address):
        self.last_login_at = datetime.now(UTC)
        self.last_login_ip = ip_address
        self.login_count += 1
        self.reset_failed_attempts()
        db.session.commit()

    def generate_email_verification_token(self):
        import secrets
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = datetime.now(UTC)
        db.session.commit()
        return self.email_verification_token

    def generate_password_reset_token(self):
        import secrets
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_sent_at = datetime.now(UTC)
        db.session.commit()
        return self.password_reset_token

    def verify_email(self, token):
        if not self.email_verification_token or self.email_verification_token != token:
            return False
        if self.email_verification_sent_at < datetime.now(UTC) - timedelta(days=1):
            return False
        self.is_email_verified = True
        self.email_verification_token = None
        self.email_verification_sent_at = None
        db.session.commit()
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        } 