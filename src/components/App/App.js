import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Route, Routes, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomeComponent from '../Home/Home.component';
import Ideas from '../Ideas/Ideas.component';
import LoginComponent from '../Login/Login.component';
import OurTeamComponent from '../OurTeam/OurTeam.component';
import RegisterComponent from '../Register/Register.component';
import VerifyComponent from '../Register/Verify.component';
import UserAccountComponent from '../UserAccount/UserAccount.component';
import TransitionWrapperComponent from '../Style/TransitionWrapper.component';
import '../Style/TransitionWrapper.component.css';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '../Style/ToastStyles.css';  // <-- Import custom toast styles
import { io } from 'socket.io-client';

const API_URL = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL_PROD : process.env.REACT_APP_API_URL_DEV;
const SOCKET_URL = API_URL.replace('/api', '');
const socket = io(SOCKET_URL);

const INACTIVITY_TIMEOUT = 300000; // 5 minutes
const PrivateRoute = ({ element, ...rest }) => {
  const isAuthenticated = localStorage.getItem('user');
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const inactivityTimer = useRef(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/home');
    toast.success('Logged out successfully!');
    setIsNavbarCollapsed(true); // Close the navbar after logout
  }, [navigate]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);

    const handleNewIdea = (idea) => {
      toast.info(`New idea published: ${idea.title}`);
    };

    const handleLikeIdea = (likeData) => {
      toast.info('An idea was liked!');
    };

    socket.on('newIdea', handleNewIdea);
    socket.on('likeIdea', handleLikeIdea);

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    window.addEventListener('beforeunload', handleLogout);
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      socket.off('newIdea', handleNewIdea);
      socket.off('likeIdea', handleLikeIdea);
      window.removeEventListener('beforeunload', handleLogout);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      clearTimeout(inactivityTimer.current);
    };
  }, [handleLogout]);

  useEffect(() => {
    setIsNavbarCollapsed(true); // Collapse the navbar on route change
  }, [location]);

  const toggleNavbar = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed);
  };

  const loggedInLinks = [
    { label: `Hi ${user ? user.fullName : ''}!`, path: '' },
    { path: '/user-account', label: 'My Profile' },
    { path: '/ideas', label: 'Ideas' },
    { path: '/our-team', label: 'Meet The Team' }
  ];

  return (
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
          <span className="navbar-brand">ScholarShareNet</span>
          <button
              className="navbar-toggler"
              type="button"
              aria-controls="navbarNav"
              aria-expanded={!isNavbarCollapsed}
              aria-label="Toggle navigation"
              onClick={toggleNavbar}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isNavbarCollapsed ? '' : 'show'}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              {user ? (
                  loggedInLinks.map(link => (
                      <li className="nav-item" key={link.label}>
                        {link.path ? (
                            <Link className="nav-link" to={link.path}>{link.label}</Link>
                        ) : (
                            <span className="nav-link">{link.label}</span>
                        )}
                      </li>
                  ))
              ) : (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/home">Home</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/our-team">Meet The Team</Link>
                    </li>
                    {location.pathname !== '/home' && (
                        <li className="nav-item">
                          <Link className="nav-link" to="/login">Sign in</Link>
                        </li>
                    )}
                  </>
              )}
            </ul>
            <ul className="navbar-nav ms-auto">
              {user && (
                  <li className="nav-item">
                    <button className="btn btn-link nav-link" onClick={() => { handleLogout(); }}>Logout</button>
                  </li>
              )}
            </ul>
          </div>
        </nav>
        <div className="container mt-5">
          <TransitionWrapperComponent location={location}>
            <Routes location={location}>
              <Route path="/home" element={<HomeComponent />} />
              <Route path="/ideas" element={<PrivateRoute element={<Ideas />} />} />
              <Route path="/login" element={<LoginComponent setUser={setUser} />} />
              <Route path="/our-team" element={<OurTeamComponent />} />
              <Route path="/register" element={<RegisterComponent />} />
              <Route path="/user-account" element={<PrivateRoute element={<UserAccountComponent user={user} />} />} />
              <Route path="/verify" element={<VerifyComponent />} />
              <Route path="/" element={<HomeComponent />} />
            </Routes>
          </TransitionWrapperComponent>
        </div>
        <ToastContainer />
      </div>
  );
}

export default App;
