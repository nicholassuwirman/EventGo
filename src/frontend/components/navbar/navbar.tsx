import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css'; 

const Navbar: React.FC = () => {
    return (
        <nav className='navbar-container'>
            <Link to="/" className='event-go-text'>
                EventGo
            </Link>

            <div className='navbar-links-container'>
                <Link to="/eventsHome" className='navbar-links'>
                    Events
                </Link>
                <Link to="/participantsHome" className='navbar-links'>
                    Participants
                </Link>
                <Link to="/" className='navbar-links'>
                    Overview
                </Link>
            </div>
           

            
            
        </nav>
    );
};

export default Navbar;