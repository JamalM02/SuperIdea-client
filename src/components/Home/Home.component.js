import React, { useState, useEffect } from 'react';
import './Home.component.css';
import logo from '../../assets/logo-superida.png';
import { getReport } from '../../services/api.service';
import { Link } from 'react-router-dom';

function HomeComponent() {
    const [report, setReport] = useState(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const response = await getReport();
            setReport(response);
        } catch (error) {
            console.error('Failed to fetch report', error);
        }
    };

    return (
        <div className="home-container">
            <div className="home-title-container">
                <img className="home-logo" src={logo} alt="SuperIdea Logo"/>
            </div>
            <div className="home-content-container">
                <h1 className="home-title">Welcome to<br/> ScholarShareNet!</h1>
                <div className="home-log-content-container">
                    <p className="home-log-description">Got a great Summary Materials?!</p>
                    <div className="home-log-login-register-container">
                        <Link to="/login" className="home-login-container">
                            <div className="home-login-link">Sign in</div>
                        </Link>
                        <p className="home-or-text">or</p>
                        <Link to="/register" className="home-register-container">
                            <div className="home-register-link">Sign up</div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="home-reports-container">
                <h1 className="home-reports-title">Reports</h1>
                {report ? (
                    <div className="home-reports-table-wrapper">
                        <table className="home-reports-table table">
                            <thead className="home-reports-thead">
                            <tr>
                                <th>Role</th>
                                <th>Posts</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Students</td>
                                <td>{report.totalStudentIdeas}</td>
                            </tr>
                            <tr>
                                <td>Lecturers</td>
                                <td>{report.totalTeacherIdeas}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Loading report...</p>
                )}
            </div>
        </div>
    );
}

export default HomeComponent;
