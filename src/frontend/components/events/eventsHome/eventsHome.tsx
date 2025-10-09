import React, { useState } from 'react';
import './eventsHome.css';

type EventCardProps = {
  image: string;
  name: string;
  date: string;
  duration: string;
  description: string;
};

const EventCard: React.FC<EventCardProps> = ({ image, name, date, duration, description }) => (
  <div className="event-card">
    <img src={image} alt="Event" className="event-card-image" />
    <div className="event-card-details">
      <h3 className="event-card-title">{name}</h3>
      <p className="event-card-date">Date: {date}</p>
      <p className="event-card-duration">Duration: {duration}</p>
      <p className="event-card-duration">Description: {description}</p>
      <div className="event-card-actions">
        <button className="event-card-edit">Edit</button>
        <button className="event-card-delete">Delete</button>
      </div>
    </div>
  </div>
);

const exampleEvent = {
  image: '/assets/event-example.jpg',
  name: 'Sample Event',
  date: '2025-10-15',
  duration: '2 hours',
  description: 'This is a sample event description.',
};

const EventsHome: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

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
        <EventCard
          image={exampleEvent.image}
          name={exampleEvent.name}
          date={exampleEvent.date}
          duration={exampleEvent.duration}
          description={exampleEvent.description}
        />
      </div>
      
      {/*showModal and below is the pop out add event when add event button is clicked */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Event</h2>
            <form>
              <label>
                Event Name:
                <input type="text" name="name" placeholder="Event Name" />
              </label>
              <label>
                Date:
                <input type="date" name="date" />
              </label>
              <label>
                Duration:
                <input type="text" name="duration" placeholder="Duration" />
              </label>
              <label>
                Description:
                <textarea name="description" placeholder="Description" rows={3} />
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