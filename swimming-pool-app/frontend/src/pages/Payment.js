import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';
import './Payment.css';

const stripePromise = loadStripe('pk_test_51234567890abcdef'); // Replace with your Stripe publishable key

const PaymentForm = ({ passType, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/payments/create-intent', {
                    passTypeId: passType.id
                });
                setClientSecret(response.data.clientSecret);
            } catch (error) {
                setError('Failed to initialize payment');
            }
        };

        createPaymentIntent();
    }, [passType.id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!stripe || !elements) {
            setError('Stripe has not loaded yet');
            setLoading(false);
            return;
        }

        const card = elements.getElement(CardElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            try {
                const response = await axios.post('http://localhost:5000/api/payments/process', {
                    paymentIntentId: paymentIntent.id,
                    passTypeId: passType.id
                });
                onPaymentSuccess(response.data.pass);
            } catch (err) {
                setError('Payment succeeded but failed to create pass');
            }
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <div className="card-element-container">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
                type="submit" 
                disabled={!stripe || loading || !clientSecret}
                className="payment-button"
            >
                {loading ? 'Processing...' : `Pay ₹${(passType.price * 83).toFixed(2)}`}
            </button>
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
                    <p>Secure payment powered by Stripe</p>
                </div>

                <div className="pass-summary">
                    <h3>{passType.name}</h3>
                    <p>{passType.description}</p>
                    <div className="price-display">
                        <span className="price">₹{(passType.price * 83).toFixed(2)}</span>
                        <span className="price">${passType.price}</span>
                        <span className="duration">
                            {passType.duration_days === 1 ? 'Per Day' :
                             passType.duration_days === 30 ? 'Per Month' :
                             'Per Year'}
                        </span>
                    </div>
                </div>

                <div className="payment-section">
                    <h4>Payment Information</h4>
                    <Elements stripe={stripePromise}>
                        <PaymentForm 
                            passType={passType} 
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    </Elements>
                </div>

                <div className="security-notice">
                    <p>🔒 Your payment information is secure and encrypted</p>
                    <p>💳 We accept all major credit cards</p>
                    <p>📱 You'll receive your QR code immediately after payment</p>
                </div>
            </div>
        </div>
    );
};

export default Payment;
