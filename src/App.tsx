import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './frontend/components/navbar/navbar'
import Home from './frontend/components/home/home'
import EventsHome from './frontend/components/events/eventsHome/eventsHome'
import EventsAdd from './frontend/components/events/eventsAdd/eventsAdd'
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
          <Route path="/events/add" element={<EventsAdd />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
