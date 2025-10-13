import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './home.css';
import eventLogo from '../../../assets/event-logo.png';
import participantLogo from '../../../assets/participant-logo.png';
import tagLogo from '../../../assets/tag-logo.png';
import dashboardLogo from '../../../assets/dashboard-logo.png';

// Dashboard Stats Component
const StatCard: React.FC<{ title: string; value: string | number; iconSrc: string; bgColor: string }> = ({
  title, value, iconSrc, bgColor
}) => (
  <div className={`stat-card ${bgColor}`}>
    <div className="stat-icon">
      <img src={iconSrc} alt={title} className="stat-icon-img" />
    </div>
    <div className="stat-content">
      <h3 className="stat-value">{value}</h3>
      <p className="stat-title">{title}</p>
    </div>
  </div>
);

// Quick Actions Component
const QuickAction: React.FC<{ title: string; description: string; link: string; color: string }> = ({
  title, description, link, color
}) => (
  <Link to={link} className={`quick-action ${color}`}>
    <h4>{title}</h4>
    <p>{description}</p>
    <span className="action-arrow">→</span>
  </Link>
);

// Recent Events Component
const RecentEventCard: React.FC<{ event: any }> = ({ event }) => (
  <div className="recent-event-card">
    <div className="event-date">
      <div className="day">{new Date(event.date).getDate()}</div>
      <div className="month">{new Date(event.date).toLocaleDateString('en', { month: 'short' })}</div>
    </div>
    <div className="event-details">
      <h4>{event.name}</h4>
      <p className="event-location">{event.place}</p>
      <p className="event-time">{event.duration}</p>
    </div>
    <div className="event-participants">
      <span>{event.participants?.length || 0} participants</span>
    </div>
  </div>
);

const Home: React.FC = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalTags: 0,
    upcomingEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch events
      const eventsResponse = await fetch('http://localhost:4000/api/events');
      const eventsData = await eventsResponse.json();
      const events = Array.isArray(eventsData) ? eventsData : [];
      
      // Fetch participants
      const participantsResponse = await fetch('http://localhost:4000/api/participants');
      const participantsData = await participantsResponse.json();
      const participants = Array.isArray(participantsData) ? participantsData : [];
      
      // Fetch tags
      const tagsResponse = await fetch('http://localhost:4000/api/tags');
      const tagsData = await tagsResponse.json();
      const tags = Array.isArray(tagsData) ? tagsData : [];

      // Calculate events this month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const eventsThisMonth = events.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      });

      setStats({
        totalEvents: events.length,
        totalParticipants: participants.length,
        totalTags: tags.length,
        upcomingEvents: eventsThisMonth.length
      });

      // Get closest events to today (3 closest to current date)
      const today = new Date();
      const sortedEvents = events
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          const diffA = Math.abs(today.getTime() - dateA.getTime());
          const diffB = Math.abs(today.getTime() - dateB.getTime());
          return diffA - diffB;
        })
        .slice(0, 3);
      setRecentEvents(sortedEvents);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for events update signal
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eventsUpdated') {
        fetchDashboardData();
        // Clear the signal
        localStorage.removeItem('eventsUpdated');
      }
    };

    const handleFocus = () => {
      // Refresh when window gains focus (in case user came back from events page)
      if (localStorage.getItem('eventsUpdated')) {
        fetchDashboardData();
        localStorage.removeItem('eventsUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's your event management overview.</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Events" 
          value={stats.totalEvents} 
          iconSrc={eventLogo} 
          bgColor="stat-blue"
        />
        <StatCard 
          title="Participants" 
          value={stats.totalParticipants} 
          iconSrc={participantLogo} 
          bgColor="stat-green"
        />
        <StatCard 
          title="Tags" 
          value={stats.totalTags} 
          iconSrc={tagLogo} 
          bgColor="stat-purple"
        />
        <StatCard 
          title="Events This Month" 
          value={stats.upcomingEvents} 
          iconSrc={dashboardLogo} 
          bgColor="stat-orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2 className="card-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <QuickAction 
              title="Create Event"
              description="Plan a new event with participants"
              link="/eventsHome"
              color="orange"
            />
            <QuickAction 
              title="Manage Participants"
              description="Add or edit participant information"
              link="/participantsHome"
              color="orange"
            />
            <QuickAction 
              title="Organize Tags"
              description="Create and manage event categories"
              link="/tags"
              color="orange"
            />
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Events</h2>
            <Link to="/eventsHome" className="view-all-link">View All</Link>
          </div>
          <div className="recent-events-list">
            {recentEvents.length === 0 ? (
              <div className="empty-state">
                <p>No events yet. <Link to="/eventsHome">Create your first event</Link></p>
              </div>
            ) : (
              recentEvents.map((event, index) => (
                <RecentEventCard key={index} event={event} />
              ))
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Home;