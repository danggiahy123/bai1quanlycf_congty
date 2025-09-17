const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server...');

// Kill existing server process
const killProcess = spawn('taskkill', ['/f', '/im', 'node.exe'], { shell: true });
killProcess.on('close', () => {
  console.log('✅ Killed existing server processes');
  
  // Start new server
  setTimeout(() => {
    const serverProcess = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });
    
    serverProcess.on('error', (err) => {
      console.error('❌ Error starting server:', err);
    });
    
    console.log('✅ Server restarted with new code');
  }, 2000);
});

killProcess.on('error', (err) => {
  console.log('⚠️  No existing server to kill, starting new one...');
  
  const serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (err) => {
    console.error('❌ Error starting server:', err);
  });
  
  console.log('✅ Server started with new code');
});
