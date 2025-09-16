@echo off
echo 🚀 Starting all services for Cafe Management System...
echo.

echo 📱 Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo 📱 Starting Mobile Frontend...
start "Mobile Frontend" cmd /k "cd frontend/mobile && npx expo start"

timeout /t 3 /nobreak >nul

echo 🖥️ Starting Web Admin...
start "Web Admin" cmd /k "cd webadmin && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ✅ All services are starting...
echo.
echo 📱 Access URLs:
echo    Backend API: http://localhost:5000
echo    Mobile App: http://localhost:3000 (Expo)
echo    Web Admin: http://localhost:5173
echo.
echo 💡 Check the opened terminal windows for any errors.
echo 💡 Press any key to exit this script...
pause >nul
