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

// DELETE /api/events/:id - Delete event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  mockEvents.splice(eventIndex, 1);
  res.json({ message: 'Event deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Events API: http://localhost:${PORT}/api/events`);
});