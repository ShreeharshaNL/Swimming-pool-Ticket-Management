import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    🏊‍♂️ AquaPass
                </Link>
                
                <div className="navbar-menu">
                    <Link to="/" className="navbar-link">
                        Home
                    </Link>
                    
                    {user ? (
                        <>
                            <Link to="/dashboard" className="navbar-link">
                                Dashboard
                            </Link>
                            <Link to="/qr-scanner" className="navbar-link">
                                QR Scanner
                            </Link>
                            <span className="navbar-user">
                                Welcome, {user.username}!
                            </span>
                            <button 
                                onClick={handleLogout}
                                className="navbar-button logout"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="navbar-link">
                                Login
                            </Link>
                            <Link to="/register" className="navbar-button">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;