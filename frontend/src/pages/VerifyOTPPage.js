import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP } from '../services/api';
import './AuthPages.css';

function VerifyOTPPage() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const handleChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setOtp(value);
        }
        if (error) setError('');
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError("Email not found. Please try registering again.");
            return;
        }
        
        if (!otp.trim()) {
            setError("Please enter the OTP code.");
            return;
        }
        
        if (otp.length !== 6) {
            setError("Please enter a complete 6-digit code.");
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const response = await verifyOTP(email, otp);
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError("Invalid OTP or it has expired. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = otp.trim().length === 6;

    return (
        <div className="auth-holographic-container">
            {/* Holographic Background */}
            <div className="holographic-background">
                <div className="holo-grid"></div>
                <div className="floating-crystals">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`crystal crystal-${i % 3 + 1}`}></div>
                    ))}
                </div>
                <div className="energy-waves">
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                    <div className="wave wave-3"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="holographic-content">
                <div className="holo-verification-container">
                    {/* Header Section */}
                    <div className="holo-header">
                        <div className="holo-logo-section">
                            <div className="holo-logo">
                                <div className="logo-core">🔐</div>
                                <div className="logo-energy">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`energy-ring ring-${i + 1}`}></div>
                                    ))}
                                </div>
                            </div>
                            <h1 className="holo-title">Account Verification</h1>
                        </div>

                        <div className="verification-info">
                            <div className="info-card">
                                <div className="info-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </div>
                                <div className="info-content">
                                    <div className="info-title">Verification Code Sent</div>
                                    <div className="info-email">{email}</div>
                                    <div className="info-subtitle">Check your inbox and enter the 6-digit code</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleVerify} className="holo-form">
                        <div className="otp-field-container">
                            <div className="field-label">
                                <span className="label-text">Verification Code</span>
                                <span className="label-counter">{otp.length}/6</span>
                            </div>
                            
                            <div className="otp-input-wrapper">
                                <div className="otp-background-effect"></div>
                                <input
                                    type="text"
                                    name="otp"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className={`holo-otp-input ${error ? 'error' : ''} ${otp.length === 6 ? 'complete' : ''}`}
                                    maxLength="6"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoFocus
                                />
                                <div className="otp-digit-indicators">
                                    {[...Array(6)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`digit-indicator ${i < otp.length ? 'filled' : ''}`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="holo-error-alert">
                                <div className="error-pulse"></div>
                                <div className="error-content">
                                    <div className="error-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="15" y1="9" x2="9" y2="15"/>
                                            <line x1="9" y1="9" x2="15" y2="15"/>
                                        </svg>
                                    </div>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className={`holo-verify-btn ${isLoading ? 'loading' : ''} ${isFormValid ? 'ready' : ''}`}
                            disabled={!isFormValid || isLoading}
                        >
                            <div className="btn-energy-field"></div>
                            <div className="btn-content">
                                {isLoading ? (
                                    <>
                                        <div className="holo-loading-animation">
                                            <div className="loading-core"></div>
                                            <div className="loading-rings">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className={`loading-ring ring-${i + 1}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Activate Account</span>
                                        <div className="btn-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M9 12l2 2 4-4"/>
                                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                            </svg>
                                        </div>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    {/* Footer Section */}
                    <div className="holo-footer">
                        <div className="footer-actions">
                            <div className="resend-section">
                                <span className="resend-text">Didn't receive the code?</span>
                                <button 
                                    type="button" 
                                    className="holo-resend-btn"
                                    onClick={() => window.location.reload()}
                                    disabled={isLoading}
                                >
                                    <span>Resend Code</span>
                                    <div className="resend-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="security-indicator">
                            <div className="security-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    <path d="M9 12l2 2 4-4"/>
                                </svg>
                            </div>
                            <span>Secure verification process protected by encryption</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyOTPPage;