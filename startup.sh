#!/bin/bash
set -e

cd /home/site/wwwroot

# Install dependencies using system Python (to user directory)
python3 -m pip install --upgrade pip --user
python3 -m pip install -r requirements.txt --user

# Navigate to backend and start
cd backend
exec python3 -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
