from flask import jsonify
from . import app, db, redis_client

# Import routes and models here
# The health endpoints are now in __init__.py 