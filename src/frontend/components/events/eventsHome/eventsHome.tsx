import React, { useState, useEffect } from 'react';
import './eventsHome.css';

type Tag = {
  id: number;
  name: string;
  color: string;
};

type Participant = {
  id: number;
  name: string;
  age: number;
};

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
  tags?: Tag[];
  participants?: Participant[];
};

type EventCardProps = {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
};

//this is the event card
const EventCard: React.FC<EventCardProps> = ({ event, onDelete, onEdit }) => {
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <div className="event-card">
      <div className="event-card-details">
        <h3 className="event-card-title">{event.name}</h3>
        <p className="event-card-date">Date: {new Date(event.date).toLocaleDateString()}</p>
        <p className="event-card-duration">Duration: {event.duration}</p>
        <p className="event-card-duration">Place: {event.place}</p>
        <p className="event-card-duration">Description: {event.description}</p>
        
        {/*display event tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="event-tags">
            <span className="event-tags-label">Tags: </span>
            {event.tags.map(tag => (
              <span 
                key={tag.id} 
                className="event-tag"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/*show participants button */}
        {event.participants && event.participants.length > 0 && (
          <div className="event-participants-section">
            <button 
              className="show-participants-btn"
              onClick={() => setShowParticipants(true)}
            >
              Show Participants ({event.participants.length})
            </button>
          </div>
        )}
        
        <div className="event-card-actions">
          <button className="event-card-edit" onClick={() => onEdit(event)}>Edit</button>
          <button className="event-card-delete" onClick={() => onDelete(event.id)}>Delete</button>
        </div>
      </div>

      {/*participants Modal */}
      {showParticipants && (
        <div className="participants-modal-overlay" onClick={() => setShowParticipants(false)}>
          <div className="participants-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="participants-modal-header">
              <h3>Participants - {event.name}</h3>
              <button className="participants-modal-close" onClick={() => setShowParticipants(false)}>×</button>
            </div>
            <div className="participants-modal-list">
              {event.participants?.map(participant => (
                <div key={participant.id} className="participant-item">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-age">{participant.age} years old</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventsHome: React.FC = () => {
  //search/filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPlace, setSearchPlace] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  //TODO: participant array not showing the participants in the cards?
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: '',
    description: '',
    place: '',
    tagIds: [] as number[],
    participantIds: [] as number[]
  });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterByTag, setFilterByTag] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  //fetch events from backend
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/events');
      if (response.ok) {
        const data = await response.json();
        //ensure data is an array
        setEvents(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch events:', response.status);
        setErrorMessage('Failed to load events. Please refresh the page.');
        setEvents([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('Failed to connect to server. Please check your connection.');
      setEvents([]);
      setLoading(false);
    }
  };

  //fetch tags from backend
  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  //fetch participants from backend
  const fetchParticipants = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/participants');
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  //fetch events by specific tag
  const fetchEventsByTag = async (tagId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/by-tag/${tagId}`);
      if (response.ok) {
        const data = await response.json();
        //ensure data is an array
        setEvents(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch events by tag:', response.status);
        setEvents([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events by tag:', error);
      setEvents([]);
      setLoading(false);
    }
  };

  //add or update event
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
        console.log('Saved event:', savedEvent); //debug log
        
        //update the events state
        setEvents(prevEvents => {
          if (editingEvent) {
            const updatedEvents = prevEvents.map(event => 
              event.id === savedEvent.id ? savedEvent : event
            );
            console.log('Updated events:', updatedEvents); //debug log
            return updatedEvents;
          } else {
            return [...prevEvents, savedEvent];
          }
        });
        
        // signal that events were updated for dashboard refresh
        localStorage.setItem('eventsUpdated', Date.now().toString());
        
        //reset form and close modal
        setFormData({ name: '', date: '', duration: '', description: '' , place: '', tagIds: [], participantIds: []});
        setShowModal(false);
        setEditingEvent(null);
        setErrorMessage(''); //clear any previous errors
        
        // dont refetch all events to maintain order - the state update above is sufficient
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
    }
  };

  //delete event
  const handleDeleteEvent = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setErrorMessage(''); //clear any previous errors
        setEvents(events.filter(event => event.id !== id));
        //signal that events were updated for dashboard refresh
        localStorage.setItem('eventsUpdated', Date.now().toString());
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
    }
  };

  //handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'tagIds' && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions);
      const selectedTagIds = selectedOptions.map(option => parseInt(option.value));
      setFormData({
        ...formData,
        tagIds: selectedTagIds
      });
    } else if (e.target.name === 'participantIds' && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions);
      const selectedParticipantIds = selectedOptions.map(option => parseInt(option.value));
      setFormData({
        ...formData,
        participantIds: selectedParticipantIds
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  //close the modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', duration: '', description: '', place: '', tagIds: [], participantIds: [] });
    setErrorMessage(''); //clear error when closing modal
  };

  //handle edit button click
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      duration: event.duration,
      description: event.description,
      place: event.place,
      tagIds: event.tags ? event.tags.map(tag => tag.id) : [],
      participantIds: event.participants ? event.participants.map(participant => participant.id) : []
    });
    setShowModal(true);
  };

  //handle filter by tag
  const handleFilterByTag = (tagId: number | null) => {
    setFilterByTag(tagId);
    setLoading(true);
    if (tagId) {
      fetchEventsByTag(tagId);
    } else {
      fetchEvents();
    }
  };

  //fetch events, tags and participants on component mount
  useEffect(() => {
    fetchEvents();
    fetchTags();
    fetchParticipants();
  }, []);

  return (
    <div className="events-home-container">
      <div className="events-home-header">
        <h1>Events</h1>
        {/*search and filter bar */}
        <div className='events-home-bar' >
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Search by place..."
              value={searchPlace}
              onChange={e => setSearchPlace(e.target.value)}
              className="search-input"
            />
            <input
              type="date"
              placeholder="Start date"
              value={searchStartDate}
              onChange={e => setSearchStartDate(e.target.value)}
              className="search-date-input"
            />
            <input
              type="date"
              placeholder="End date"
              value={searchEndDate}
              onChange={e => setSearchEndDate(e.target.value)}
              className="search-date-input"
            />
            {/*filter by tag dropdown */}
            <select 
              value={filterByTag || ''} 
              onChange={e => handleFilterByTag(e.target.value ? parseInt(e.target.value) : null)}
              className="filter-dropdown"
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
      </div>

      {/* Display error message if any */}
      {errorMessage && (
        <div className="error-message" style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '1em',
          border: '1px solid #ef5350'
        }}>
          {errorMessage}
        </div>
      )}

      <div className="events-list">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found. Add your first event!</p>
        ) : (
          (() => {
            console.log('Rendering events:', events);
            console.log('Current filters:', { searchTerm, searchPlace, searchStartDate, searchEndDate });
            const filteredEvents = events.filter(event => {
              //filter by name
              if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
              //filter by place
              if (searchPlace && !event.place.toLowerCase().includes(searchPlace.toLowerCase())) return false;
              //filter by date range
              if (searchStartDate && new Date(event.date) < new Date(searchStartDate)) return false;
              if (searchEndDate && new Date(event.date) > new Date(searchEndDate)) return false;
              return true;
            });
            console.log('Filtered events:', filteredEvents);
            return filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={handleDeleteEvent}
                onEdit={handleEditClick}
              />
            ));
          })()
        )}
      </div>
      
      {/* ab this is the pop out edit event window */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingEvent ? 'Edit Event' : 'Add Event'}</h2>

            {/* Display error message in modal if any */}
            {errorMessage && (
              <div className="error-message" style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '1em',
                border: '1px solid #ef5350',
                fontSize: '0.9em'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <label>
                Event Name:
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Event Name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  minLength={1}
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
                  required
                  minLength={1}
                />
              </label>
              <label>
                Place:
                <input 
                  type="text" 
                  name="place" 
                  placeholder="Place" 
                  value={formData.place}
                  onChange={handleInputChange}
                  required
                  minLength={1}
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
                  required
                  minLength={1}
                />
              </label>
              <label>
                Tags (hold Ctrl/Cmd to select multiple):
                <select
                  name="tagIds"
                  multiple
                  value={formData.tagIds.map(String)}
                  onChange={handleInputChange}
                  className="select-multiple"
                >
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <small className="select-help-text">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple tags
                </small>
              </label>
              <label>
                Participants (hold Ctrl/Cmd to select multiple):
                <select
                  name="participantIds"
                  multiple
                  value={formData.participantIds.map(String)}
                  onChange={handleInputChange}
                  className="select-multiple"
                >
                  {participants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name} ({participant.age} years old)
                    </option>
                  ))}
                </select>
                <small className="select-help-text">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple participants
                </small>
              </label>
              <div className="modal-actions">
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