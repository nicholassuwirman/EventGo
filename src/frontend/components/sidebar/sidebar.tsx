import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.css';
import dashboardLogo from '../../../assets/dashboard-logo.png';
import eventLogo from '../../../assets/event-logo.png';
import participantLogo from '../../../assets/participant-logo.png';
import tagLogo from '../../../assets/tag-logo.png';
import mapLogo from '../../../assets/map-logo.png';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/home', name: 'Dashboard', icon: dashboardLogo },
    { path: '/eventsHome', name: 'Events', icon: eventLogo },
    { path: '/participantsHome', name: 'Participants', icon: participantLogo },
    { path: '/tags', name: 'Tags', icon: tagLogo },
    { path: '/map', name: 'Map', icon: mapLogo },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/home" className="sidebar-logo">
          EventGo
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <Link
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <img src={item.icon} alt={item.name} className="sidebar-icon-img" />
                <span className="sidebar-text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      
    </div>
  );
};

export default Sidebar;