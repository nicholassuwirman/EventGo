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
}

// Mock events
const mockEvents: Event[] = [
  {
    id: 1,
    name: 'Sample Event',
    date: '2025-10-15',
    duration: '2 hours',
    description: 'This is a sample event'
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
  const { name, date, duration, description } = req.body;
  const newEvent: Event = {
    id: mockEvents.length + 1,
    name,
    date,
    duration,
    description
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

// PUT /api/events/:id to Update event
app.put('/api/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, date, duration, description } = req.body;
  const eventIndex = mockEvents.findIndex(event => event.id === parseInt(id));
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  mockEvents[eventIndex] = {
    ...mockEvents[eventIndex],
    name,
    date,
    duration,
    description
  };
  res.json(mockEvents[eventIndex]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Events API: http://localhost:${PORT}/api/events`);
});

// Add these new state variables at the top of EventsHome component
const EventsHome: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null); // NEW: Track which event is being edited
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: '',
    description: ''
  });

  // ... existing code ...

  // NEW: Handle editing an event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEvent) return;
    
    try {
      console.log('Updating event with ID:', editingEvent.id);
      const response = await fetch(`http://localhost:4000/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const updatedEvent = await response.json();
        console.log('Event updated:', updatedEvent);
        
        // Update the event in the list
        setEvents(events.map(event => 
          event.id === editingEvent.id ? updatedEvent : event
        ));
        
        // Reset form and close modal
        setFormData({ name: '', date: '', duration: '', description: '' });
        setEditingEvent(null);
        setShowModal(false);
      } else {
        console.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // NEW: Handle clicking the Edit button
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      duration: event.duration,
      description: event.description
    });
    setShowModal(true);
  };

  // UPDATE: Modified form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    if (editingEvent) {
      handleEditEvent(e);
    } else {
      handleAddEvent(e);
    }
  };

  // UPDATE: Reset editing state when closing modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', duration: '', description: '' });
  };

  // ... rest of existing code ...

