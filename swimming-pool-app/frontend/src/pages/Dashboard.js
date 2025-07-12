import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchUserPasses();
    }, []);

    const fetchUserPasses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/user-passes');
            setPasses(response.data);
        } catch (error) {
            setError('Failed to fetch passes');
            console.error('Error fetching passes:', error);
        } finally {
            setLoading(false);
        }
    };

    const isPassActive = (pass) => {
        const currentDate = new Date();
        const endDate = new Date(pass.end_date);
        return pass.status === 'active' && currentDate <= endDate;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPassStatus = (pass) => {
        if (pass.status === 'expired') return 'Expired';
        if (pass.status === 'cancelled') return 'Cancelled';
        
        const currentDate = new Date();
        const endDate = new Date(pass.end_date);
        
        if (currentDate > endDate) return 'Expired';
        return 'Active';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#28a745';
            case 'Expired': return '#dc3545';
            case 'Cancelled': return '#6c757d';
            default: return '#6c757d';
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Welcome back, {user?.username}!</h1>
                    <p>Manage your swimming pool passes</p>
                </div>

                {loading ? (
                    <div className="loading">Loading your passes...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="dashboard-content">
                        {passes.length === 0 ? (
                            <div className="no-passes">
                                <div className="no-passes-icon">🏊‍♂️</div>
                                <h3>No passes yet</h3>
                                <p>Get started by purchasing your first swimming pool pass!</p>
                                <a href="/" className="cta-button">Browse Passes</a>
                            </div>
                        ) : (
                            <div className="passes-grid">
                                {passes.map((pass) => (
                                    <div key={pass.id} className="pass-card">
                                        <div className="pass-header">
                                            <h3>{pass.pass_type_name}</h3>
                                            <div 
                                                className="pass-status"
                                                style={{ 
                                                    backgroundColor: getStatusColor(getPassStatus(pass)),
                                                    color: 'white'
                                                }}
                                            >
                                                {getPassStatus(pass)}
                                            </div>
                                        </div>
                                        
                                        <div className="pass-details">
                                            <div className="pass-info">
                                                <div className="info-item">
                                                    <span className="info-label">Valid From:</span>
                                                    <span className="info-value">{formatDate(pass.start_date)}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Valid Until:</span>
                                                    <span className="info-value">{formatDate(pass.end_date)}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Price:</span>

                                                    <span className="info-value">₹{(pass.price * 83).toFixed(2)}</span>

                                                    <span className="info-value">${pass.price}</span>

                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Purchased:</span>
                                                    <span className="info-value">{formatDate(pass.created_at)}</span>
                                                </div>
                                            </div>
                                            
                                            {isPassActive(pass) && pass.qrCode && (
                                                <div className="qr-code-section">
                                                    <h4>Your QR Code</h4>
                                                    <div className="qr-code-container">
                                                        <img 
                                                            src={pass.qrCode} 
                                                            alt="QR Code" 
                                                            className="qr-code"
                                                        />
                                                    </div>
                                                    <p className="qr-instructions">
                                                        Show this QR code to staff at the pool entrance
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;