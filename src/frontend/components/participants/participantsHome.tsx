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

  //get or fetch all events
  const fetchParticipants = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/participants');
      const data = await response.json();
      setParticipants(data);
    } catch(error){
      console.error('cant fetch events in participantsHome', error);
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
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error saving participant:', error);
    }
  };

  useEffect(() => {
      fetchParticipants();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Delete participant
  const handleDeleteParticipant = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/participants/${id}`, {
        method: 'DELETE',
      });

      if(response.ok) {
        setParticipants(participants.filter(participant => participant.id !== id));
      }
    } catch (error){
      console.error('Error deleting participant:', error);
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

      <div className="events-list">
        {participants.map((participant) => (
          <div className="event-card" key={participant.id}>
            <div className="event-card-details">
              <h3 className="event-card-title">{participant.name}</h3>
              <p className="event-card-date">Age: {participant.age}</p>
              
              {/* Display participant events */}
              {participant.events && participant.events.length > 0 && (
                <div className="participant-events" style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Events: </span>
                  {participant.events.map(event => (
                    <span 
                      key={event.id} 
                      className="participant-event" 
                      style={{ 
                        backgroundColor: '#3B82F6',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        marginRight: '4px',
                        display: 'inline-block'
                      }}
                    >
                      {event.name}
                    </span>
                  ))}
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
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setFormData({ name: '', age: '' });
          setEditingParticipant(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingParticipant ? 'Edit Participant' : 'Add Participant'}</h2>
            <form onSubmit={handleFormSubmit}>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
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
                />
              </label>
              <div style={{ marginTop: '1em', display: 'flex', gap: '1em' }}>
                <button type="submit" className="event-card-edit">
                  {editingParticipant ? 'Update' : 'Add'}
                </button>
                <button type="button" className="event-card-delete" onClick={() => {
                  setShowModal(false);
                  setFormData({ name: '', age: '' });
                  setEditingParticipant(null);
                }}>
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

export default ParticipantsHome;