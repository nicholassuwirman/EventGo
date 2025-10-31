import React, { useState, useEffect } from 'react';
import './participantsHome.css';

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
};

type Participant = {
  id: number;
  name: string;
  age: number;
  events?: Event[];
};

type ParticipantsCardProps = {
  participant: Participant; //object of class Participant is named participant
  onEdit: (participant: Participant) => void;
  onDelete: (id: number) => void;
};

const ParticipantsHome: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [formData, setFormData] = useState({ name: '', age: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedParticipantEvents, setSelectedParticipantEvents] = useState<{ events: Event[], participantName: string }>({ events: [], participantName: '' });
  const [errorMessage, setErrorMessage] = useState<string>('');

  //determine if an event is upcoming or already in the past
  const getEventStatus = (eventDate: string): 'upcoming' | 'past' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); //set to start of today
    
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(0, 0, 0, 0); //set to start of event date
    
    return eventDateTime >= today ? 'upcoming' : 'past';
  };

  //get or fetch all events
  const fetchParticipants = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/participants');
      if (!response.ok) {
        setErrorMessage('Failed to load participants. Please refresh the page.');
        return;
      }
      const data = await response.json();
      setParticipants(data);
    } catch(error){
      console.error('cant fetch events in participantsHome', error);
      setErrorMessage('Failed to connect to server. Please check your connection.');
    }
  }

  //add event to database
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingParticipant
        ? `http://localhost:4000/api/participants/${editingParticipant.id}`
        : 'http://localhost:4000/api/participants';
      const method = editingParticipant ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          age: Number(formData.age)
        }),
      });

      if (response.ok) {
        const savedParticipant = await response.json();
        setParticipants(participants => {
          if (editingParticipant) {
            return participants.map(p => p.id === savedParticipant.id ? savedParticipant : p);
          } else {
            return [...participants, savedParticipant];
          }
        });
        setFormData({ name: '', age: '' });
        setShowModal(false);
        setEditingParticipant(null);
        setErrorMessage(''); //clear any previous errors
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to save participant');
      }
    } catch (error) {
      console.error('Error saving participant:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
    }
  };

  useEffect(() => {
      fetchParticipants();
  }, []);

  //handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //delete participant
  const handleDeleteParticipant = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/participants/${id}`, {
        method: 'DELETE',
      });

      if(response.ok) {
        setParticipants(participants.filter(participant => participant.id !== id));
        setErrorMessage(''); //clear any previous errors
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete participant');
      }
    } catch (error){
      console.error('Error deleting participant:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
    }
  };

  const handleEditParticipant = (participant: Participant) => {
    setFormData({ name: participant.name, age: participant.age.toString() });
    setEditingParticipant(participant);
    setShowModal(true);
  };

  return (
    <div className="participants-home-container">
      <div className="events-home-header">
        <h1>Participants</h1>
        <button className="events-home-add-btn" onClick={() => setShowModal(true)}>
          + Add Participant
        </button>
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
        {participants.map((participant) => (
          <div className="event-card" key={participant.id}>
            <div className="event-card-details">
              <h3 className="event-card-title">{participant.name}</h3>
              <p className="event-card-date">Age: {participant.age}</p>
              
              {/*Show events button */}
              {participant.events && participant.events.length > 0 && (
                <div className="participant-events-section">
                  <button 
                    className="show-events-btn"
                    onClick={() => {
                      setSelectedParticipantEvents({ events: participant.events || [], participantName: participant.name });
                      setShowEventsModal(true);
                    }}
                  >
                    Show Events ({participant.events.length})
                  </button>
                </div>
              )}
              
              <div className="event-card-actions">
                <button className="event-card-edit" onClick={() => handleEditParticipant(participant)}>Edit</button>
                <button className="event-card-delete" onClick={() => handleDeleteParticipant(participant.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingParticipant ? 'Edit Participant' : 'Add Participant'}</h2>
            
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
                Name:
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  minLength={1}
                  placeholder="Enter participant name"
                />
              </label>
              <label>
                Age:
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min={0}
                  max={150}
                  placeholder="Enter age (0-150)"
                />
              </label>
              <div className="modal-form-btn-container">
                <button type="submit" className="event-card-edit">
                  {editingParticipant ? 'Update' : 'Add'}
                </button>
                <button type="button" className="event-card-delete" onClick={() => {
                  setShowModal(false);
                  setFormData({ name: '', age: '' });
                  setEditingParticipant(null);
                  setErrorMessage(''); //clear error when closing modal
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && (
        <div className="events-modal-overlay" onClick={() => setShowEventsModal(false)}>
          <div className="events-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="events-modal-header">
              <h3>Events - {selectedParticipantEvents.participantName}</h3>
              <button className="events-modal-close" onClick={() => setShowEventsModal(false)}>×</button>
            </div>
            <div className="events-modal-list">
              {selectedParticipantEvents.events.map(event => {
                const eventStatus = getEventStatus(event.date);
                return (
                  <div key={event.id} className="event-item">
                    <div className="event-item-content">
                      <div className="event-item-header">
                        <span className="event-item-name">{event.name}</span>
                        <span className={`event-status ${eventStatus}`}>
                          {eventStatus === 'upcoming' ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      <span className="event-item-date">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <span className="event-item-place">{event.place}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsHome;