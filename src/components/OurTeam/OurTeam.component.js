// src/components/OurTeamComponent/OurTeamComponent.js
import React from 'react';
import './OurTeam.component.css';
import head from '../../assets/logo/logo.png';
import MatanProf from '../../assets/Matan.jpg';
import JamalProf from '../../assets/jamal.jpg';

function OurTeamComponent() {
    return (
        <div className="our-team">
            <h1>Meet The Team</h1>
            <div className="our-team-cards">
                <div className="row">
                    <div className="column">
                        <div className="card">
                            <img src={MatanProf} alt="Matan Shabi" style={{ width: '100%' }} />
                            <div className="container">
                                <h2>Matan Shabi</h2>
                                <p className="title">Co-Founder</p>
                                <p>matanlimudim20@gmail.com</p>
                                <p>
                                    <button className="button">Contact</button>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="column">
                        <div className="card">
                            <img src={JamalProf} alt="Jamal Majadle" style={{width: '100%'}}/>
                            <div className="container">
                                <h2>Jamal Majadle</h2>
                                <p className="title">Co-Founder</p>
                                <p>jamal.majadle02@gmail.com</p>
                                <p>
                                    <button className="button">Contact</button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="our-team-logo">
                    <div className="logo"><img src={head} alt="Our Team"/></div>
                </div>
            </div>
        </div>
    );
}

export default OurTeamComponent;
