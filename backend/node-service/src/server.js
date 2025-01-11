const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Redis client
const redis = new Redis(process.env.REDIS_URL);

// Health check endpoint
app.get('/health', (req, res) => {
  redis.ping()
    .then(() => {
      res.json({ status: 'healthy', redis: 'connected' });
    })
    .catch((error) => {
      console.error('Redis health check failed:', error);
      res.status(500).json({ status: 'unhealthy', redis: 'disconnected', error: error.message });
    });
});

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000'
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.log(`WebSocket server running on port ${PORT}`);
}); 