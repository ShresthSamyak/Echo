#!/bin/bash
cd backend

# Install dependencies if not already installed
pip install -r ../requirements.txt --user --quiet --no-warn-script-location

# Start the app
python -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
