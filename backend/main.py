import sys
import os

# Add the current directory to sys.path so 'from app...' works correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
