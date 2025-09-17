#!/bin/bash

echo "🚀 Starting all services for Cafe Management System..."
echo

echo "📱 Starting Backend Server..."
gnome-terminal --title="Backend Server" -- bash -c "cd backend && npm start; exec bash" &

sleep 3

echo "📱 Starting Mobile Frontend..."
gnome-terminal --title="Mobile Frontend" -- bash -c "cd frontend/mobile && npx expo start; exec bash" &

sleep 3

echo "🖥️ Starting Web Admin..."
gnome-terminal --title="Web Admin" -- bash -c "cd webadmin && npm run dev; exec bash" &

sleep 5

echo
echo "✅ All services are starting..."
echo
echo "📱 Access URLs:"
echo "   Backend API: http://localhost:5000"
echo "   Mobile App: http://localhost:3000 (Expo)"
echo "   Web Admin: http://localhost:5173"
echo
echo "💡 Check the opened terminal windows for any errors."
