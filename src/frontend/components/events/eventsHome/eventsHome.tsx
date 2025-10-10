import React, { useState, useEffect } from 'react';
import './eventsHome.css';

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
};

type EventCardProps = {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
};

//this is the event card
const EventCard: React.FC<EventCardProps> = ({ event, onDelete, onEdit }) => (
  <div className="event-card">
    <div className="event-card-details">
      <h3 className="event-card-title">{event.name}</h3>
      <p className="event-card-date">Date: {event.date}</p>
      <p className="event-card-duration">Duration: {event.duration}</p>
      <p className="event-card-duration">Description: {event.description}</p>
      <p className="event-card-duration">Place: {event.place}</p>
      <div className="event-card-actions">
        <button className="event-card-edit" onClick={() => onEdit(event)}>Edit</button>
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
    description: '',
    place: ''
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  // Add or update event
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingEvent ? `http://localhost:4000/api/events/${editingEvent.id}` : 'http://localhost:4000/api/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const savedEvent = await response.json();
        setEvents(events => {
          if (editingEvent) {
            return events.map(event => event.id === savedEvent.id ? savedEvent : event);
          } else {
            return [...events, savedEvent];
          }
        });
        setFormData({ name: '', date: '', duration: '', description: '' , place: ''});
        setShowModal(false);
        setEditingEvent(null);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error saving event:', error);
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

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', duration: '', description: '', place: '' });
  };

  // Handle edit button click
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      duration: event.duration,
      description: event.description,
      place: event.place
    });
    setShowModal(true);
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
              onEdit={handleEditClick}
            />
          ))
        )}
      </div>
      
      {/* ab this is the pop out edit event window */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={handleFormSubmit}>
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
              <label>
                Place:
                <input 
                  type="text" 
                  name="place" 
                  placeholder="Place" 
                  value={formData.place}
                  onChange={handleInputChange}
                />
              </label>
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
                <button type="submit" className="event-card-edit">
                  {editingEvent ? 'Update' : 'Add'}
                </button>
                <button type="button" className="event-card-delete" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsHome;