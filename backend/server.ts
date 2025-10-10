import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

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

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/events', (_req: Request, res: Response) => {
  res.json(mockEvents);
});

// POST /api/events/:id to add an event
app.post('/api/events', (req: Request, res: Response) => {
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

// DELETE /api/events/:id to delete event
app.delete('/api/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  mockEvents.splice(eventIndex, 1);
  res.json({ message: 'Event deleted successfully' });
});

// PUT /api/events/:id to update an event
app.put('/api/events/:id', (req: Request, res: Response) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Events API: http://localhost:${PORT}/api/events`);
});

//---PARTICIPANTS---
// Type for participants
interface Participant {
  id: number;
  name: string;
  age: number;
}

//test participant
const testParticipant: Participant[] = [
  {
    id: 1,
    name: 'Johnny Doe',
    age: 30,
  }
];

//add participant to database
app.post('/api/participants', (req: Request, res: Response) => {
  const { name, age } = req.body;

  const newParticipant: Participant = {
    id: testParticipant.length + 1,
    name,
    age
  };
  testParticipant.push(newParticipant);
  res.status(201).json(newParticipant)
})

//get all participants
app.get('/api/participants', (_req: Request, res: Response) => {
  res.json(testParticipant);
});

//delete a participant - FIX: Use testParticipant array, not mockEvents
app.delete('/api/participants/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const participantIndex = testParticipant.findIndex(participant => participant.id === parseInt(id));
  if(participantIndex === -1) {
    return res.status(404).json({ error: 'Participant not found'});
  }
  testParticipant.splice(participantIndex, 1); // FIX: Use testParticipant
  res.json({message: 'Participant deleted successfully'});
})

//edit a participant - FIX: Remove comma and fix variable names
app.put('/api/participants/:id', (req: Request, res: Response) => {
  const {id} = req.params;
  const { name, age } = req.body;
  const participantIndex = testParticipant.findIndex(participant => participant.id === parseInt(id));
  if(participantIndex === -1) {
    return res.status(404).json({ error: 'Participant not found'});
  }
  testParticipant[participantIndex] = {
    ...testParticipant[participantIndex],
    name,
    age
  };
  res.json(testParticipant[participantIndex]);
});