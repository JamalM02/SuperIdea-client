import React, { useState } from 'react';
import './OurTeam.component.css';
import '../Style/ModalStyle.component.css'; // Import your custom modal styles
import head from '../../assets/logo/logo.png';
import MatanProf from '../../assets/Matan.jpg';
import JamalProf from '../../assets/jamal.jpg';

function OurTeamComponent() {
    const [expandedSections, setExpandedSections] = useState({
        team: false,
        terms: false,
        contact: false
    });
    const OurMail = process.env.REACT_APP_ADMIN_EMAIL;
    const JamalMail = process.env.REACT_APP_JAMAL_EMAIL;
    const MatanMail = process.env.REACT_APP_MATAN_EMAIL;


    // Function to handle email contact
    const handleContactClick = (email) => {
        window.location.href = `mailto:${email}`;
    };

    // Function to toggle sections
    const toggleSection = (section) => {
        setExpandedSections((prevSections) => ({
            ...prevSections,
            [section]: !prevSections[section]
        }));
    };

    return (
        <div className="our-team">
            <h1 className="about-us-header">About Us</h1>
            <p>
                ScholarShareNet is an online platform designed to help students share and access academic materials.
                Our mission is to provide a collaborative environment where students can easily find and share
                high-quality
                resources to support their studies. Whether you're looking for notes, project guides, or study
                materials,
                ScholarShareNet is here to make your learning journey smoother and more collaborative.
            </p>
            <div className="our-team-logo">
                <img src={head} alt="Team Logo" style={{width: '100px', borderRadius: '50%'}}/>
            </div>

            <h2 onClick={() => toggleSection('team')} style={{cursor: 'pointer'}}>
                Meet The Team
            </h2>
            {expandedSections.team && (
                <div className="our-team-cards">
                    <div className="row">
                        <div className="column">
                            <div className="card">
                                <img src={MatanProf} alt="Matan Shabi" style={{width: '100%'}}/>
                                <div className="container">
                                    <h2>Matan Shabi</h2>
                                    <p className="title">Co-Founder</p>
                                    <div className="social-media">
                                        <a href="https://www.linkedin.com/in/matan-shabi/" target="_blank"
                                           rel="noopener noreferrer">
                                            <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                                                 alt="LinkedIn" className="social-icon"/>
                                        </a>
                                        <a href="https://github.com/MaTaN-DeHater" target="_blank"
                                           rel="noopener noreferrer">
                                            <img src="https://cdn-icons-png.flaticon.com/512/733/733553.png"
                                                 alt="GitHub" className="social-icon"/>
                                        </a>
                                        <a href={`mailto:${MatanMail}`}>
                                            <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email"
                                                 className="social-icon"/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="column">
                            <div className="card">
                                <img src={JamalProf} alt="Jamal Majadle" style={{width: '100%'}}/>
                                <div className="container">
                                    <h2>Jamal Majadle</h2>
                                    <p className="title">Co-Founder</p>
                                    <div className="social-media">
                                        <a href="https://www.linkedin.com/in/jamal-majadle/" target="_blank"
                                           rel="noopener noreferrer">
                                            <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                                                 alt="LinkedIn" className="social-icon"/>
                                        </a>
                                        <a href="https://github.com/JamalM02" target="_blank"
                                           rel="noopener noreferrer">
                                            <img src="https://cdn-icons-png.flaticon.com/512/733/733553.png"
                                                 alt="GitHub" className="social-icon"/>
                                        </a>
                                        <a href={`mailto:${JamalMail}`}>
                                            <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email"
                                                 className="social-icon"/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 onClick={() => toggleSection('terms')} style={{cursor: 'pointer'}}>
                Terms and Policy
            </h2>
            {expandedSections.terms && (
                <div className="section-content">
                    <h5 className={"section-title"}>Terms and Conditions</h5>
                    <p className={"section-details"}>By accessing and using ScholarShareNet, you accept and agree to be
                        bound by the terms and
                        conditions outlined below. If you do not agree with these terms, please do not use the
                        platform.</p>
                    <h5 className={"section-title"}>User Accounts</h5>
                    <p className={"section-details"}>To access certain features of the platform, users must register and
                        create an account. Users
                        are responsible for maintaining the confidentiality of their login credentials and for all
                        activities that occur under their accounts.</p>
                    <h5 className={"section-title"}>User-Generated Content</h5>
                    <p className={"section-details"}>Users can upload, share, and download study materials. By submitting content, users affirm
                        that they own the rights or have the necessary permissions for the materials shared.
                        ScholarShareNet reserves the right to remove any content deemed inappropriate, copyrighted
                        without permission, or in violation of these terms.</p>
                    <h5 className={"section-title"}>Accuracy of Content</h5>
                    <p className={"section-details"}>ScholarShareNet strives to maintain a high-quality platform; however, we do not guarantee the
                        accuracy, reliability, or completeness of the content uploaded by users. Users are advised
                        to verify the information and check the materials before using or downloading them.
                        ScholarShareNet is not responsible for any inaccuracies or issues arising from the use of
                        user-generated content.</p>
                    <h5 className={"section-title"}>Use of Platform</h5>
                    <p className={"section-details"}>ScholarShareNet is intended solely for educational purposes. Users are prohibited from
                        uploading or sharing harmful, offensive, or illegal content, using the platform for
                        commercial purposes or unauthorized advertising, or attempting to hack, disrupt, or misuse
                        the services provided.</p>
                    <h5 className={"section-title"}>Termination of Accounts</h5>
                    <p className={"section-details"}>ScholarShareNet reserves the right to terminate or suspend user accounts that violate these
                        terms, without prior notice.</p>
                </div>
            )}

            <h2 onClick={() => toggleSection('contact')} style={{cursor: 'pointer'}}>
                Contact Us
            </h2>
            {expandedSections.contact && (
                <div className="section-content">
                    <p>If you have any questions or concerns regarding these terms or the privacy policy, please <a className={"contact-us"}
                        href={`mailto:${OurMail}`}>contact us</a></p>
                </div>
            )}
        </div>
    );
}

export default OurTeamComponent;
