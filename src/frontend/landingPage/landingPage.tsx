import React from 'react';
import './landingPage.css';
import landingHero from '../../assets/landing-hero.webp';

const LandingPage: React.FC = () => {
    return (
        <div className="landing-container">
            <div className='landing-container-up'>
                <div className=''>
                    <p className='landing-eventgo'>EventGo</p>
                </div>
                <div className='landing-container-up-text-container'>
                    <div className='landing-container-up-text-container-left'>
                        <p className='landing-text-1'>Events are supposed to be fun for the planner too.</p>
                    </div>
                    <div className='landing-container-up-text-container-right'>
                        <p className='landing-text-2'>
                            Plan events, manage participants, and create custom tags, all in one place. Our mission is to bring the fun back to event planning, without the hassle.
                        </p>
                        <a href="/home" className="landing-plan-btn">
                            PLAN YOUR EVENT
                        </a>
                    </div>
                </div>
            </div>
            <div className='landing-container-below'>
                <img
                    src={landingHero}
                    alt="Landing Hero"
                    className="landing-hero-img"
                />
                <div className="landing-hero-tint" />
            </div>
        </div>
    );
};

export default LandingPage;