@echo off
echo Starting Cafe Admin Development Environment...
echo.

echo Starting MongoDB (if not running)...
start "MongoDB" mongod --dbpath ./data/db

echo.
echo Starting API Server...
start "API Server" cmd /k "cd /d %~dp0 && node server.js"

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo All services started!
echo - API Server: http://localhost:3001
echo - Frontend: http://localhost:5173 (or next available port)
echo - MongoDB: mongodb://localhost:27017/cafe_admin
echo.
pause
