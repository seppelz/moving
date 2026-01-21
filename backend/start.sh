#!/bin/bash
# Start MoveMaster backend on port 8080

echo "Starting MoveMaster Backend on port 8080..."
uvicorn app.main:app --reload --port 8080
