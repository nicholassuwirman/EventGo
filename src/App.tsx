import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './frontend/components/navbar/navbar'
import Home from './frontend/components/home/home'
import EventsHome from './frontend/components/events/eventsHome/eventsHome'
import ParticipantsHome from './frontend/components/participants/participantsHome' 
import TagsHome from './frontend/components/events/tags/tagsHome'
import LandingPage from './frontend/landingPage/landingPage'
import './App.css'

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';

  return (
    <>
      {showNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/eventsHome" element={<EventsHome />} />
          <Route path="/participantsHome" element={<ParticipantsHome />} /> 
          <Route path="/tags" element={<TagsHome />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
