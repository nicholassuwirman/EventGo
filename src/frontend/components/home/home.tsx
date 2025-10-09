import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';
import homeEventImg from '../../../assets/home-event.webp';
import homePeopleImg from '../../../assets/home-people.jpeg';

type HomeSectionProps = {
  imageName: string;
  description1: string;
  description2: string;
  description3: string;
  linkTo: string; 
};

const HomeSection: React.FC<HomeSectionProps> = ({imageName, description1, description2, description3, linkTo }) => {
  return (
    <div className='home-section'>
      <img
        src={imageName}
        alt="Event"
        className='home-section-image'
      />
      <div className='home-section-right'>
        <p className='home-section-title'>{description1}</p>
        <p className='home-section-description'>{description2}</p>
        <Link to={linkTo} className='home-section-button'>
          {description3}
        </Link>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className='home-container'>
      <HomeSection
        imageName={homeEventImg}
        description1="Events"
        description2="Plan, add and manage your events with ease."
        description3="View Events"
        linkTo="/eventsHome"
      />

      <HomeSection
        imageName={homePeopleImg}
        description1="People"
        description2="Easily add, view, and manage event participants."
        description3="View Participants"
        linkTo="/participants"
      />
    </div>
  );
};

export default Home;