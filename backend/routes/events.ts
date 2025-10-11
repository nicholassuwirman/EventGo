import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Type for event
interface Event {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
}

// Mock events
const mockEvents: Event[] = [
  {
    id: 1,
    name: 'Sample Event',
    date: '2025-10-15',
    duration: '2 hours',
    description: 'This is a sample event',
    place: 'Furtfrank'
  }
];

// GET all events
router.get('/', (_req: Request, res: Response) => {
  res.json(mockEvents);
});

// POST to add an event
router.post('/', (req: Request, res: Response) => {
  const { name, date, duration, description, place } = req.body;
  const newEvent: Event = {
    id: mockEvents.length + 1,
    name,
    date,
    duration,
    description, 
    place
  };
  mockEvents.push(newEvent);
  res.status(201).json(newEvent);
});

// DELETE to delete event
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  mockEvents.splice(eventIndex, 1);
  res.json({ message: 'Event deleted successfully' });
});

// PUT to update an event
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, date, duration, description, place } = req.body;
  const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  mockEvents[eventIndex] = {
    ...mockEvents[eventIndex],
    name,
    date,
    duration,
    description,
    place
  };
  res.json(mockEvents[eventIndex]);
});

export default router;