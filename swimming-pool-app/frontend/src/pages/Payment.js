import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Payment.css';

// Mock Payment Form Component
const MockPaymentForm = ({ passType, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        // Simulate payment processing
        setTimeout(async () => {
            try {
                // Mock successful payment
                const mockPaymentId = 'mock_payment_' + Date.now();
                
                // Create pass without real payment processing
                const response = await axios.post('http://localhost:5000/api/payments/mock-process', {
                    paymentId: mockPaymentId,
                    passTypeId: passType.id,
                    amount: passType.price
                });
                
                onPaymentSuccess(response.data.pass);
            } catch (error) {
                setError('Payment processing failed. Please try again.');
            }
            setLoading(false);
        }, 2000); // Simulate 2 second processing time
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
                <label>Cardholder Name</label>
                <input
                    type="text"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleChange}
                    placeholder="Enter cardholder name"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>Card Number</label>
                <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="form-input"
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label>CVV</label>
                    <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        maxLength="3"
                        className="form-input"
                    />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <button 
                type="submit" 
                disabled={loading}
                className="payment-button"
            >
                {loading ? 'Processing...' : `Pay ₹${(passType.price * 83).toFixed(2)}`}
            </button>

            <div className="mock-notice">
                💡 This is a mock payment system for testing. No real charges will be made.
            </div>
        </form>
    );
};

const Payment = () => {
    const { passId } = useParams();
    const navigate = useNavigate();
    const [passType, setPassType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [purchasedPass, setPurchasedPass] = useState(null);

    const fetchPassType = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pass-types');
            const selectedPass = response.data.find(pass => pass.id === parseInt(passId));
            
            if (selectedPass) {
                setPassType(selectedPass);
            } else {
                setError('Pass type not found');
            }
        } catch (error) {
            setError('Failed to fetch pass details');
        } finally {
            setLoading(false);
        }
    }, [passId]);

    useEffect(() => {
        fetchPassType();
    }, [fetchPassType]);

    const handlePaymentSuccess = (pass) => {
        setPurchasedPass(pass);
        setPaymentSuccess(true);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="payment-container">
                <div className="loading">Loading payment details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-container">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate('/')} className="back-button">
                    Back to Home
                </button>
            </div>
        );
    }

    if (paymentSuccess && purchasedPass) {
        return (
            <div className="payment-container">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Payment Successful!</h2>
                    <p>Your {purchasedPass.passType} has been purchased successfully.</p>
                    
                    <div className="pass-details">
                        <h3>Pass Details:</h3>
                        <p><strong>Type:</strong> {purchasedPass.passType}</p>
                        <p><strong>Valid From:</strong> {new Date(purchasedPass.startDate).toLocaleDateString()}</p>
                        <p><strong>Valid Until:</strong> {new Date(purchasedPass.endDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="qr-code-preview">
                        <h4>Your QR Code:</h4>
                        <img src={purchasedPass.qrCode} alt="QR Code" className="qr-code" />
                        <p>Show this QR code at the pool entrance</p>
                    </div>
                    
                    <button onClick={handleBackToDashboard} className="dashboard-button">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-container">
            <div className="payment-card">
                <div className="payment-header">
                    <h2>Complete Your Purchase</h2>
                    <p>🇮🇳 Mock Payment System (India-Friendly)</p>
                </div>
                
                <div className="pass-summary">
                    <h3>{passType.name}</h3>
                    <p>{passType.description}</p>
                    <div className="price-display">
                        <span className="price">₹{(passType.price * 83).toFixed(2)}</span>
                        <span className="duration">
                            {passType.duration_days === 1 ? 'Per Day' : 
                             passType.duration_days === 30 ? 'Per Month' : 
                             'Per Year'}
                        </span>
                    </div>
                </div>
                
                <div className="payment-section">
                    <h4>Payment Information</h4>
                    <MockPaymentForm 
                        passType={passType} 
                        onPaymentSuccess={handlePaymentSuccess}
                    />
                </div>
                
                <div className="security-notice">
                    <p>🔒 This is a test payment system</p>
                    <p>💳 No real charges will be made</p>
                    <p>📱 You'll receive your QR code after mock payment</p>
                </div>
            </div>
        </div>
    );
};

export default Payment;