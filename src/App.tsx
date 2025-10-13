import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './frontend/components/sidebar/sidebar'
import Home from './frontend/components/home/home'
import EventsHome from './frontend/components/events/eventsHome/eventsHome'
import ParticipantsHome from './frontend/components/participants/participantsHome' 
import TagsHome from './frontend/components/events/tags/tagsHome'
import MapHome from './frontend/components/map/MapHome'
import LandingPage from './frontend/landingPage/landingPage'
import './App.css'

function AppContent() {
  const location = useLocation();
  const showSidebar = location.pathname !== '/';

  return (
    <div className="app-layout">
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'main-content' : 'main-content-full'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/eventsHome" element={<EventsHome />} />
          <Route path="/participantsHome" element={<ParticipantsHome />} /> 
          <Route path="/tags" element={<TagsHome />} />
          <Route path="/map" element={<MapHome />} />
        </Routes>
      </main>
    </div>
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
