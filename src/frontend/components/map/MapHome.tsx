import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './mapHome.css';
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

  // Geocode a location using OpenStreetMap Nominatim API with timeout
  const geocodeLocation = async (place: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      // Clean and encode the place name
      const cleanPlace = place.trim();
      const encodedPlace = encodeURIComponent(cleanPlace);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased to 5 second timeout
      
      // Try without country restrictions first for better coverage
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPlace}&limit=3&addressdetails=1`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      let data = await response.json();
      
      // If no results, try with more specific search
      if (!data || data.length === 0) {
        console.log(`No results found for "${place}", trying alternative search...`);
        
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
        
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPlace}&limit=1&addressdetails=1&extratags=1`,
          { signal: controller2.signal }
        );
        
        clearTimeout(timeoutId2);
        
        if (response.ok) {
          data = await response.json();
        }
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log(`Successfully geocoded "${place}" to:`, result.display_name);
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        };
      }
      
      console.warn(`Could not geocode location: "${place}"`);
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Geocoding timeout for "${place}"`);
      } else {
        console.error(`Error geocoding location "${place}":`, error);
      }
      return null;
    }
  };

  // Geocode all events with caching and parallel processing
  const geocodeEvents = async (eventsList: Event[]) => {
    setLoading(false); // Show map immediately while geocoding in background
    setGeocodingStatus(`Starting geocoding for ${eventsList.length} events...`);
    
    const eventsWithCoordsTemp: EventWithCoords[] = [];
    
    // Check localStorage for cached coordinates first
    const cachedCoords = localStorage.getItem('eventCoordinates');
    let coordsCache = cachedCoords ? JSON.parse(cachedCoords) : {};
    
    // Process events in smaller batches to avoid API rate limits
    const batchSize = 2; // Smaller batch size for better reliability
    const batches = [];
    for (let i = 0; i < eventsList.length; i += batchSize) {
      batches.push(eventsList.slice(i, i + batchSize));
    }
    
    let totalProcessed = 0;
    let successCount = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      const batchPromises = batch.map(async (event) => {
        try {
          // Check cache first
          const cacheKey = event.place.toLowerCase().trim();
          if (coordsCache[cacheKey] && coordsCache[cacheKey].lat && coordsCache[cacheKey].lon) {
            console.log(`Using cached coordinates for "${event.place}"`);
            return {
              ...event,
              latitude: coordsCache[cacheKey].lat,
              longitude: coordsCache[cacheKey].lon
            };
          }
          
          // Clean invalid cache entries
          if (coordsCache[cacheKey] === null) {
            delete coordsCache[cacheKey];
          }
          
          // Geocode if not in cache
          console.log(`Geocoding "${event.place}"...`);
          const coords = await geocodeLocation(event.place);
          if (coords && coords.lat && coords.lon) {
            // Cache the result
            coordsCache[cacheKey] = coords;
            console.log(`Successfully geocoded "${event.place}" to lat: ${coords.lat}, lon: ${coords.lon}`);
            return {
              ...event,
              latitude: coords.lat,
              longitude: coords.lon
            };
          } else {
            console.warn(`Failed to geocode "${event.place}"`);
            // Don't cache null results to allow retries
            return null;
          }
        } catch (error) {
          console.error(`Error processing event "${event.place}":`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(Boolean) as EventWithCoords[];
      
      eventsWithCoordsTemp.push(...validResults);
      successCount += validResults.length;
      totalProcessed += batch.length;
      
      // Update status
      setGeocodingStatus(`Processing... ${totalProcessed}/${eventsList.length} (${successCount} located)`);
      
      // Update the map with current results
      setEventsWithCoords([...eventsWithCoordsTemp]);
      
      // Longer delay between batches to respect API limits
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Save cache to localStorage
    localStorage.setItem('eventCoordinates', JSON.stringify(coordsCache));
    
    console.log(`Geocoding complete: ${successCount}/${eventsList.length} events have coordinates`);
    setGeocodingStatus(`Found ${successCount} of ${eventsList.length} event locations`);
    
    // Clear status after a few seconds
    setTimeout(() => setGeocodingStatus(''), 5000);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchEvents();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      // Start geocoding in background but don't block map display
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
          <p className="map-subtitle">
            Explore all events on the interactive map. Click on markers to see event details.
          </p>
        </div>
        <div className="map-loading">
          <p>Loading map...</p>
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
        {geocodingStatus && (
          <div className="geocoding-status">
            <p>{geocodingStatus}</p>
          </div>
        )}
        
      </div>

      <div className="map-container">
        <MapContainer
          center={[51.1657, 10.4515]} // Center of Germany as default
          zoom={6}
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