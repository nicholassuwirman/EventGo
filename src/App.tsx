import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './frontend/components/navbar/navbar'
import Home from './frontend/components/home/home'
import EventsHome from './frontend/components/events/eventsHome/eventsHome'
import ParticipantsHome from './frontend/components/participants/participantsHome' 
import TagsHome from './frontend/components/events/tags/tagsHome';
import './App.css'

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/eventsHome" element={<EventsHome />} />
          <Route path="/participantsHome" element={<ParticipantsHome />} /> 
          <Route path="/tags" element={<TagsHome />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
