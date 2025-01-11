from functools import wraps
from typing import Any, Callable
from flask import current_app
from ..models import db

def with_transaction(f: Callable) -> Callable:
    """
    Decorator to handle database transactions and rollback on error.
    
    Usage:
        @with_transaction
        def my_db_function():
            # Your database operations here
            pass
    """
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        try:
            result = f(*args, **kwargs)
            db.session.commit()
            return result
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error in {f.__name__}: {str(e)}")
            raise
    return decorated

def safe_commit() -> None:
    """
    Safely commit database changes with automatic rollback on error.
    """
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during database commit: {str(e)}")
        raise 