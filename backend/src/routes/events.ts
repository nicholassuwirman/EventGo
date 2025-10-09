import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

//CRUD
// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  const { name, date, duration, description } = req.body;
  
  if (!name || !date) {
    return res.status(400).json({ error: 'Name and date are required' });
  }

  try {
    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        duration,
        description
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, date, duration, description } = req.body;
  
  try {
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        name,
        date: new Date(date),
        duration,
        description
      }
    });
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.event.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;