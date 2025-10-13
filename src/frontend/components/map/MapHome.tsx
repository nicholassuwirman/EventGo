import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './MapHome.css';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type Event = {
  id: number;
  name: string;
  date: string;
  duration: string;
  description: string;
  place: string;
  latitude?: number;
  longitude?: number;
};

type EventWithCoords = Event & {
  latitude: number;
  longitude: number;
};

const MapHome: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsWithCoords, setEventsWithCoords] = useState<EventWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingStatus, setGeocodingStatus] = useState('');

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/events');
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  // Geocode a location using OpenStreetMap Nominatim API
  const geocodeLocation = async (place: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      // Clean and encode the place name
      const cleanPlace = place.trim();
      const encodedPlace = encodeURIComponent(cleanPlace);
      
      // Use OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPlace}&limit=1&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error geocoding location "${place}":`, error);
      return null;
    }
  };

  // Geocode all events
  const geocodeEvents = async (eventsList: Event[]) => {
    setGeocodingStatus('Geocoding event locations...');
    const eventsWithCoordsTemp: EventWithCoords[] = [];
    
    for (let i = 0; i < eventsList.length; i++) {
      const event = eventsList[i];
      setGeocodingStatus(`Geocoding ${i + 1}/${eventsList.length}: ${event.place}`);
      
      const coords = await geocodeLocation(event.place);
      
      if (coords) {
        eventsWithCoordsTemp.push({
          ...event,
          latitude: coords.lat,
          longitude: coords.lon
        });
      } else {
        console.log(`Could not geocode location: ${event.place}`);
      }
      
      // Add a small delay to be respectful to the API
      if (i < eventsList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setEventsWithCoords(eventsWithCoordsTemp);
    setGeocodingStatus('');
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchEvents();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      geocodeEvents(events);
    } else {
      setLoading(false);
    }
  }, [events]);

  if (loading) {
    return (
      <div className="map-home-container">
        <div className="map-home-header">
          <h1>Event Map</h1>
        </div>
        <div className="map-loading">
          <p>Loading events...</p>
          {geocodingStatus && <p>{geocodingStatus}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="map-home-container">
      <div className="map-home-header">
        <h1>Event Map</h1>
        <p className="map-subtitle">
          Explore all events on the interactive map. Click on markers to see event details.
        </p>
      </div>
      
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-number">{events.length}</span>
          <span className="stat-label">Total Events</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{eventsWithCoords.length}</span>
          <span className="stat-label">Mapped Events</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{events.length - eventsWithCoords.length}</span>
          <span className="stat-label">Unmapped</span>
        </div>
      </div>

      <div className="map-container">
        {eventsWithCoords.length > 0 ? (
          <MapContainer
            center={[39.8283, -98.5795]} // Center of USA as default
            zoom={4}
            style={{ height: '600px', width: '100%' }}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {eventsWithCoords.map((event) => (
              <Marker
                key={event.id}
                position={[event.latitude, event.longitude]}
              >
                <Popup>
                  <div className="map-popup">
                    <h3>{event.name}</h3>
                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> {event.place}</p>
                    <p><strong>Duration:</strong> {event.duration}</p>
                    <p><strong>Description:</strong> {event.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="no-events-message">
            <h3>No mappable events found</h3>
            <p>
              Events will appear on the map when their locations can be geocoded. 
              Make sure event locations are recognizable place names (e.g., "New York", "Berlin", "California").
            </p>
          </div>
        )}
      </div>
      
      {events.length > eventsWithCoords.length && eventsWithCoords.length > 0 && (
        <div className="unmapped-events">
          <h3>Events not shown on map:</h3>
          <ul>
            {events
              .filter(event => !eventsWithCoords.find(mapped => mapped.id === event.id))
              .map(event => (
                <li key={event.id}>
                  <strong>{event.name}</strong> - {event.place} (location not recognized)
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};

export default MapHome;