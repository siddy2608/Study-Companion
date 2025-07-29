import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import './AuthPages.css';

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(0);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors when user starts typing
        if (error) setError('');
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }
        
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setError('');
        setIsLoading(true);

        try {
            await register({ 
                username: formData.username, 
                email: formData.email, 
                password: formData.password 
            });
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            setError('Registration failed. Username or email may already exist.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.username.trim() && 
                       formData.email.trim() && 
                       formData.password.trim() && 
                       formData.confirmPassword.trim() &&
                       formData.password === formData.confirmPassword;

    const handleStepInteraction = (step) => {
        setCurrentStep(step);
    };

    return (
        <div className="auth-neon-container">
            {/* Animated Neon Background */}
            <div className="neon-background">
                <div className="neon-grid"></div>
                <div className="floating-particles">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className={`particle particle-${i % 4 + 1}`}></div>
                    ))}
                </div>
                <div className="neon-circles">
                    <div className="neon-circle circle-1"></div>
                    <div className="neon-circle circle-2"></div>
                    <div className="neon-circle circle-3"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="neon-content">
                {/* Header Section */}
                <div className="neon-header">
                    <div className="neon-logo-container">
                        <div className="neon-logo">
                            <div className="logo-inner">📚</div>
                            <div className="logo-glow"></div>
                        </div>
                        <h1 className="neon-title">
                            <span className="title-word">Study</span>
                            <span className="title-word">Companion</span>
                        </h1>
                    </div>
                    <p className="neon-subtitle">Join the Future of Learning</p>
                </div>

                {/* Form Section */}
                <div className="neon-form-wrapper">
                    <div className="neon-form-container">
                        <div className="form-progress">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: `${((Object.keys(formData).filter(key => formData[key].trim()).length) / 4) * 100}%`}}></div>
                            </div>
                            <div className="progress-text">
                                {Object.keys(formData).filter(key => formData[key].trim()).length} of 4 fields completed
                            </div>
                        </div>

                        <form onSubmit={handleRegister} className="neon-form">
                            <div className="form-grid">
                                <div 
                                    className={`neon-field ${currentStep === 0 ? 'active' : ''}`}
                                    onFocus={() => handleStepInteraction(0)}
                                >
                                    <div className="field-header">
                                        <div className="field-number">01</div>
                                        <div className="field-title">Username</div>
                                    </div>
                                    <div className="neon-input-container">
                                        <div className="input-glow"></div>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Choose your unique identity"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className={fieldErrors.username ? 'error' : ''}
                                        />
                                        <div className="input-border"></div>
                                    </div>
                                    {fieldErrors.username && (
                                        <div className="neon-error">{fieldErrors.username}</div>
                                    )}
                                </div>

                                <div 
                                    className={`neon-field ${currentStep === 1 ? 'active' : ''}`}
                                    onFocus={() => handleStepInteraction(1)}
                                >
                                    <div className="field-header">
                                        <div className="field-number">02</div>
                                        <div className="field-title">Email</div>
                                    </div>
                                    <div className="neon-input-container">
                                        <div className="input-glow"></div>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter your digital address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className={fieldErrors.email ? 'error' : ''}
                                        />
                                        <div className="input-border"></div>
                                    </div>
                                    {fieldErrors.email && (
                                        <div className="neon-error">{fieldErrors.email}</div>
                                    )}
                                </div>

                                <div 
                                    className={`neon-field ${currentStep === 2 ? 'active' : ''}`}
                                    onFocus={() => handleStepInteraction(2)}
                                >
                                    <div className="field-header">
                                        <div className="field-number">03</div>
                                        <div className="field-title">Password</div>
                                    </div>
                                    <div className="neon-input-container">
                                        <div className="input-glow"></div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Create your secret key"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className={fieldErrors.password ? 'error' : ''}
                                        />
                                        <button
                                            type="button"
                                            className="neon-reveal-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                {showPassword ? (
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                ) : (
                                                    <>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                        <div className="input-border"></div>
                                    </div>
                                    {fieldErrors.password && (
                                        <div className="neon-error">{fieldErrors.password}</div>
                                    )}
                                </div>

                                <div 
                                    className={`neon-field ${currentStep === 3 ? 'active' : ''}`}
                                    onFocus={() => handleStepInteraction(3)}
                                >
                                    <div className="field-header">
                                        <div className="field-number">04</div>
                                        <div className="field-title">Confirm Password</div>
                                    </div>
                                    <div className="neon-input-container">
                                        <div className="input-glow"></div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Verify your secret key"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className={fieldErrors.confirmPassword ? 'error' : ''}
                                        />
                                        <button
                                            type="button"
                                            className="neon-reveal-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isLoading}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                {showConfirmPassword ? (
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                ) : (
                                                    <>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                        <div className="input-border"></div>
                                    </div>
                                    {fieldErrors.confirmPassword && (
                                        <div className="neon-error">{fieldErrors.confirmPassword}</div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="neon-alert">
                                    <div className="alert-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <triangle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                    </div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={`neon-submit-btn ${isLoading ? 'loading' : ''}`}
                                disabled={!isFormValid || isLoading}
                            >
                                <div className="btn-background"></div>
                                <div className="btn-content">
                                    {isLoading ? (
                                        <>
                                            <div className="neon-spinner"></div>
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Launch Your Journey</span>
                                            <div className="btn-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                                </svg>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>

                        <div className="neon-footer">
                            <div className="footer-divider"></div>
                            <div className="footer-content">
                                <span className="footer-text">Already have an account?</span>
                                <Link to="/" className="neon-link">
                                    <span>Sign In</span>
                                    <div className="link-pulse"></div>
                                </Link>
                            </div>
                            <div className="security-badge">
                                <div className="badge-icon">🔒</div>
                                <span>Your data is encrypted and secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;