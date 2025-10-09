import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css'; 

const Navbar: React.FC = () => {
    return (
        <nav className='navbar-container'>
            <p className='event-go-text'>
                EventGo
            </p>
            <div className="navbar-search">
                <input
                    type="text"
                    placeholder="Search events..."
                    className="navbar-search-input"
                />
            </div>
            <Link to="/" className='navbar-links'>
                Home
            </Link>
            <Link to="/events" className='navbar-links'>
                Events
            </Link>
            <Link to="/tags" className='navbar-links'>
                Tags
            </Link>
            <Link to="/participants" className='navbar-links'>
                Participants
            </Link>
        </nav>
    );
};

export default Navbar;