const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock events for now
const mockEvents = [
  {
    id: 1,
    name: 'Sample Event',
    date: '2025-10-15',
    duration: '2 hours',
    description: 'This is a sample event'
  }
];

app.get('/api/events', (req, res) => {
  res.json(mockEvents);
});

app.post('/api/events', (req, res) => {
  const { name, date, duration, description } = req.body;
  const newEvent = {
    id: mockEvents.length + 1,
    name,
    date,
    duration,
    description
  };
  mockEvents.push(newEvent);
  res.status(201).json(newEvent);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Events API: http://localhost:${PORT}/api/events`);
});