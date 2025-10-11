import React, { useState, useEffect } from 'react';
import './eventsHome.css';
import TagsHome from '../tags/tagsHome';

type Tag = {
  id: number;
  name: string;
  color: string;
};

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
  tags?: Tag[];
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
      <p className="event-card-date">Date: {new Date(event.date).toLocaleDateString()}</p>
      <p className="event-card-duration">Duration: {event.duration}</p>
      <p className="event-card-duration">Place: {event.place}</p>
      <p className="event-card-duration">Description: {event.description}</p>
      
      {/* Display event tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="event-tags" style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Tags: </span>
          {event.tags.map(tag => (
            <span 
              key={tag.id} 
              className="event-tag" 
              style={{ 
                backgroundColor: tag.color, 
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                marginRight: '4px',
                display: 'inline-block'
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: '',
    description: '',
    place: '',
    tagIds: [] as number[]
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterByTag, setFilterByTag] = useState<number | null>(null);

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

  // Fetch tags from backend
  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Fetch events by specific tag
  const fetchEventsByTag = async (tagId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/by-tag/${tagId}`);
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events by tag:', error);
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
        setFormData({ name: '', date: '', duration: '', description: '' , place: '', tagIds: []});
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'tagIds' && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions);
      const selectedTagIds = selectedOptions.map(option => parseInt(option.value));
      setFormData({
        ...formData,
        tagIds: selectedTagIds
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', duration: '', description: '', place: '', tagIds: [] });
  };

  // Handle edit button click
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      duration: event.duration,
      description: event.description,
      place: event.place,
      tagIds: event.tags ? event.tags.map(tag => tag.id) : []
    });
    setShowModal(true);
  };

  // Handle filter by tag
  const handleFilterByTag = (tagId: number | null) => {
    setFilterByTag(tagId);
    setLoading(true);
    if (tagId) {
      fetchEventsByTag(tagId);
    } else {
      fetchEvents();
    }
  };

  // Fetch events and tags on component mount
  useEffect(() => {
    fetchEvents();
    fetchTags();
  }, []);

  return (
    <div className="events-home-container">
      <TagsHome />

      <div className="events-home-header">
        <h1>Events</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
          {/* Filter by tag dropdown */}
          <select 
            value={filterByTag || ''} 
            onChange={e => handleFilterByTag(e.target.value ? parseInt(e.target.value) : null)}
            style={{ 
              padding: '0.5em', 
              borderRadius: '8px', 
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          >
            <option value="">All Events</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          
          <button
            className="events-home-add-btn"
            onClick={() => setShowModal(true)}
          >
            + Add Event
          </button>
        </div>
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
              <label>
                Tags (hold Ctrl/Cmd to select multiple):
                <select
                  name="tagIds"
                  multiple
                  value={formData.tagIds.map(String)}
                  onChange={handleInputChange}
                  style={{ 
                    height: '120px', 
                    width: '100%', 
                    padding: '0.5em',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '0.8em' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple tags
                </small>
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