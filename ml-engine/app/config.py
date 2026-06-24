# ml-engine/app/config.py — Central configuration
import os

# Base directory is ml-engine/ (two levels up from app/config.py)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
