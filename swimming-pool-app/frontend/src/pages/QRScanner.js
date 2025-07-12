import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './QRScanner.css';

const QRScanner = () => {
    const [qrInput, setQrInput] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [staffId, setStaffId] = useState('');
    const [entries, setEntries] = useState([]);
    const [showEntries, setShowEntries] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus on input when component mounts
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleScan = async () => {
        if (!qrInput.trim()) {
            setError('Please enter QR code data');
            return;
        }

        setLoading(true);
        setError('');
        setScanResult(null);

        try {
            const response = await axios.post('http://localhost:5000/api/verify-qr', {
                qrData: qrInput,
                staffId: staffId || 'staff'
            });

            setScanResult({
                type: 'success',
                message: response.data.message,
                user: response.data.user
            });

            // Clear input for next scan
            setQrInput('');
            
            // Refresh entries if showing
            if (showEntries) {
                fetchEntries();
            }
        } catch (error) {
            setScanResult({
                type: 'error',
                message: error.response?.data?.error || 'Failed to verify QR code'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleScan();
        }
    };

    const fetchEntries = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pool-entries');
            setEntries(response.data);
        } catch (error) {
            console.error('Error fetching entries:', error);
        }
    };

    const toggleEntries = () => {
        setShowEntries(!showEntries);
        if (!showEntries) {
            fetchEntries();
        }
    };

    const clearResult = () => {
        setScanResult(null);
        setError('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const simulateQRScan = (passData) => {
        // For demo purposes - simulate different QR codes
        const qrData = {
            userId: 1,
            passId: 'demo-pass-123',
            passType: passData.type,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + passData.duration * 24 * 60 * 60 * 1000).toISOString(),
            timestamp: Date.now()
        };
        
        setQrInput(JSON.stringify(qrData));
    };

    return (
        <div className="qr-scanner">
            <div className="scanner-container">
                <div className="scanner-header">
                    <h1>🏊‍♂️ Pool Entry Scanner</h1>
                    <p>Scan QR codes to verify pool passes</p>
                </div>

                <div className="scanner-content">
                    <div className="scanner-section">
                        <div className="staff-input">
                            <label htmlFor="staffId">Staff ID (Optional)</label>
                            <input
                                type="text"
                                id="staffId"
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                placeholder="Enter your staff ID"
                                className="staff-input-field"
                            />
                        </div>

                        <div className="qr-input-section">
                            <label htmlFor="qrInput">QR Code Data</label>
                            <div className="qr-input-container">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    id="qrInput"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Scan or paste QR code data here"
                                    className="qr-input-field"
                                />
                                <button 
                                    onClick={handleScan}
                                    disabled={loading}
                                    className="scan-button"
                                >
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                        </div>

                        {/* Demo QR Codes */}
                        <div className="demo-section">
                            <h3>Demo QR Codes (For Testing)</h3>
                            <div className="demo-buttons">
                                <button 
                                    onClick={() => simulateQRScan({ type: 'Daily Pass', duration: 1 })}
                                    className="demo-button daily"
                                >
                                    Daily Pass
                                </button>
                                <button 
                                    onClick={() => simulateQRScan({ type: 'Monthly Pass', duration: 30 })}
                                    className="demo-button monthly"
                                >
                                    Monthly Pass
                                </button>
                                <button 
                                    onClick={() => simulateQRScan({ type: 'Yearly Pass', duration: 365 })}
                                    className="demo-button yearly"
                                >
                                    Yearly Pass
                                </button>
                            </div>
                        </div>

                        {/* Result Display */}
                        {scanResult && (
                            <div className={`scan-result ${scanResult.type}`}>
                                <div className="result-header">
                                    <div className="result-icon">
                                        {scanResult.type === 'success' ? '✅' : '❌'}
                                    </div>
                                    <h3>{scanResult.message}</h3>
                                </div>
                                
                                {scanResult.user && (
                                    <div className="user-info">
                                        <div className="user-details">
                                            <p><strong>Name:</strong> {scanResult.user.name}</p>
                                            <p><strong>Email:</strong> {scanResult.user.email}</p>
                                            <p><strong>Pass Type:</strong> {scanResult.user.passType}</p>
                                            <p><strong>Valid Until:</strong> {new Date(scanResult.user.validUntil).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <button onClick={clearResult} className="clear-button">
                                    Clear & Scan Next
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                {error}
                                <button onClick={clearResult} className="clear-button">
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="entries-section">
                        <button onClick={toggleEntries} className="entries-toggle">
                            {showEntries ? 'Hide' : 'Show'} Recent Entries
                        </button>

                        {showEntries && (
                            <div className="entries-list">
                                <h3>Recent Pool Entries</h3>
                                {entries.length === 0 ? (
                                    <p>No entries found</p>
                                ) : (
                                    <div className="entries-table">
                                        <div className="entries-header">
                                            <span>Name</span>
                                            <span>Pass Type</span>
                                            <span>Entry Time</span>
                                            <span>Staff</span>
                                        </div>
                                        {entries.map((entry) => (
                                            <div key={entry.id} className="entry-row">
                                                <span>{entry.full_name}</span>
                                                <span>{entry.pass_type_name}</span>
                                                <span>{new Date(entry.entry_time).toLocaleString()}</span>
                                                <span>{entry.staff_id}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;