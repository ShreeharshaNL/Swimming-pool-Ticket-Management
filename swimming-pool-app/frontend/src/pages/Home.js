import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [passTypes, setPassTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, demoMode } = useAuth();

    // Demo data for GitHub Pages
    const demoPassTypes = [
        {
            id: 1,
            name: 'Daily Pass',
            description: 'Access to swimming pool for one day',
            price: 0.01,
            duration_days: 1
        },
        {
            id: 2,
            name: 'Monthly Pass',
            description: 'Access to swimming pool for one month',
            price: 0.002,
            duration_days: 30
        },
        {
            id: 3,
            name: 'Yearly Pass',
            description: 'Access to swimming pool for one year',
            price: 10.00,
            duration_days: 365
        }
    ];

    useEffect(() => {
        fetchPassTypes();
    }, [demoMode]);

    const fetchPassTypes = async () => {
        if (demoMode) {
            // Use demo data when backend is not available
            setPassTypes(demoPassTypes);
            setLoading(false);
            return;
        }


    const { user } = useAuth();

    useEffect(() => {
        fetchPassTypes();
    }, []);

    const fetchPassTypes = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pass-types');
            setPassTypes(response.data);
        } catch (error) {
            console.error('Error fetching pass types:', error);

            // Fallback to demo data
            setPassTypes(demoPassTypes);


        } finally {
            setLoading(false);
        }
    };

    const handleBuyPass = (passId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        if (demoMode) {
            alert('Demo Mode: In a real deployment, this would redirect to payment processing!');
            return;
        }
        


        navigate(`/payment/${passId}`);
    };

    return (
        <div className="home">

            {demoMode && (
                <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '10px',
                    textAlign: 'center',
                    borderBottom: '1px solid #ffeaa7'
                }}>
                    🚀 Demo Mode: This is a static preview. Backend features are simulated.
                </div>
            )}
            


            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Welcome to AquaPass</h1>
                    <p>Your Gateway to Premium Swimming Experience</p>
                    <div className="hero-image">
                        <img 
                            src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                            alt="Swimming Pool" 
                        />
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="about">
                <div className="container">
                    <h2>About Our Swimming Pool</h2>
                    <div className="about-content">
                        <div className="about-text">
                            <p>
                                Experience the ultimate aquatic adventure at our state-of-the-art swimming facility. 
                                Our crystal-clear waters and modern amenities provide the perfect environment for 
                                fitness, recreation, and relaxation.
                            </p>
                            <ul>
                                <li>🏊‍♂️ Olympic-sized swimming pool</li>
                                <li>🌊 Crystal clear, temperature-controlled water</li>
                                <li>🏆 Professional lifeguards on duty</li>
                                <li>🚿 Modern changing rooms and showers</li>
                                <li>🏋️‍♀️ Fitness and aqua aerobics classes</li>
                                <li>👨‍👩‍👧‍👦 Family-friendly environment</li>
                            </ul>
                        </div>
                        <div className="about-images">
                            <img 
                                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" 
                                alt="Pool Facilities" 
                            />
                            <img 
                                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" 
                                alt="Swimming Activities" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pass Options Section */}
            <section className="pass-options">
                <div className="container">
                    <h2>Choose Your Pass</h2>
                    <p>Select the perfect pass for your swimming needs</p>
                    
                    {loading ? (
                        <div className="loading">Loading pass options...</div>
                    ) : (
                        <div className="pass-cards">
                            {passTypes.map((pass) => (
                                <div key={pass.id} className="pass-card">
                                    <div className="pass-header">
                                        <h3>{pass.name}</h3>
                                        <div className="pass-price">

                                            <span className="price">₹{(pass.price * 83).toFixed(2)}</span>

                                            <span className="price">${pass.price}</span>

                                            <span className="duration">
                                                {pass.duration_days === 1 ? 'Per Day' : 
                                                 pass.duration_days === 30 ? 'Per Month' : 
                                                 'Per Year'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pass-description">
                                        <p>{pass.description}</p>
                                        <div className="pass-features">
                                            <p>✓ Full pool access</p>
                                            <p>✓ Changing room facilities</p>
                                            <p>✓ Shower facilities</p>
                                            {pass.duration_days > 1 && <p>✓ Fitness classes included</p>}
                                            {pass.duration_days > 30 && <p>✓ Priority booking</p>}
                                        </div>
                                    </div>
                                    <button 
                                        className="buy-button"
                                        onClick={() => handleBuyPass(pass.id)}
                                    >
                                        {user ? (demoMode ? 'View Demo' : 'Buy Now') : 'Login to Buy'}
                                        {user ? 'Buy Now' : 'Login to Buy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2>Why Choose AquaPass?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Digital QR Codes</h3>
                            <p>No more physical tickets! Access the pool with your unique QR code.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💳</div>
                            <h3>Secure Payments</h3>
                            <p>Safe and secure online payment processing with multiple options.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Instant Access</h3>
                            <p>Get your pass immediately after purchase and start swimming right away.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Track Your Visits</h3>
                            <p>Monitor your swimming sessions and track your fitness progress.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;