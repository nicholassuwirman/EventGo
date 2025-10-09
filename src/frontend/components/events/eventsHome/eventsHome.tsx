import React, { useState, useEffect } from 'react';
import './eventsHome.css';

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
};

type EventCardProps = {
  event: Event;
  onDelete: (id: number) => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => (
  <div className="event-card">
    <img src="/assets/event-example.jpg" alt="Event" className="event-card-image" />
    <div className="event-card-details">
      <h3 className="event-card-title">{event.name}</h3>
      <p className="event-card-date">Date: {event.date}</p>
      <p className="event-card-duration">Duration: {event.duration}</p>
      <p className="event-card-duration">Description: {event.description}</p>
      <div className="event-card-actions">
        <button className="event-card-edit">Edit</button>
        <button className="event-card-delete" onClick={() => onDelete(event.id)}>Delete</button>
      </div>
    </div>
  </div>
);

const EventsHome: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: '',
    description: ''
  });

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/events');
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  // Add new event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    try {
      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const newEvent = await response.json();
        console.log('New event created:', newEvent);
        setEvents([...events, newEvent]);
        setFormData({ name: '', date: '', duration: '', description: '' });
        setShowModal(false);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEvents(events.filter(event => event.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="events-home-container">
      <div className="events-home-header">
        <h1>Events</h1>
        <button
          className="events-home-add-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Event
        </button>
      </div>
      <div className="events-list">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found. Add your first event!</p>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
            />
          ))
        )}
      </div>
      
      {/*showModal and below is the pop out add event when add event button is clicked */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Event</h2>
            <form onSubmit={handleAddEvent}>
              <label>
                Event Name:
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Event Name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Date:
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Duration:
                <input 
                  type="text" 
                  name="duration" 
                  placeholder="Duration" 
                  value={formData.duration}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Description:
                <textarea 
                  name="description" 
                  placeholder="Description" 
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </label>
              <div style={{ marginTop: '1em', display: 'flex', gap: '1em' }}>
                <button type="submit" className="event-card-edit">Add</button>
                <button type="button" className="event-card-delete" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsHome;

