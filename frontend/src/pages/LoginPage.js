import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import './AuthPages.css';

function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await login(formData.username, formData.password);
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.username.trim() && formData.password.trim();

    return (
        <div className="auth-cosmic-container">
            {/* Animated Background */}
            <div className="cosmic-background">
                <div className="floating-orb orb-1"></div>
                <div className="floating-orb orb-2"></div>
                <div className="floating-orb orb-3"></div>
                <div className="floating-orb orb-4"></div>
                <div className="floating-orb orb-5"></div>
                <div className="cosmic-grid"></div>
            </div>

            {/* Theme Toggle */}
            <div className="cosmic-theme-toggle">
                <ThemeToggle />
            </div>

            {/* Main Content */}
            <div className="cosmic-content">
                <div className="cosmic-left-panel">
                    <div className="cosmic-branding">
                        <div className="cosmic-logo">
                            <div className="logo-core">📚</div>
                            <div className="logo-rings">
                                <div className="ring ring-1"></div>
                                <div className="ring ring-2"></div>
                                <div className="ring ring-3"></div>
                            </div>
                        </div>
                        <h1 className="cosmic-title">Study Companion</h1>
                        <p className="cosmic-tagline">Where Knowledge Meets Innovation</p>
                    </div>
                    
                    <div className="cosmic-features">
                        <div className="feature-item">
                            <div className="feature-icon">🧠</div>
                            <div>AI-Powered Learning</div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <div>Smart Document Analysis</div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎯</div>
                            <div>Personalized Quizzes</div>
                        </div>
                    </div>
                </div>

                <div className="cosmic-right-panel">
                    <div className="cosmic-form-container">
                        <div className="form-header">
                            <h2 className="form-title">Welcome Back</h2>
                            <p className="form-subtitle">Enter your credentials to continue your learning journey</p>
                        </div>

                        <form onSubmit={handleLogin} className="cosmic-form">
                            <div className="form-field">
                                <div className="field-label">Username</div>
                                <div className="field-container">
                                    <div className="field-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                        className={error ? 'error' : ''}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <div className="field-label">Password</div>
                                <div className="field-container">
                                    <div className="field-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <circle cx="12" cy="16" r="1"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                        className={error ? 'error' : ''}
                                    />
                                    <button
                                        type="button"
                                        className="password-reveal"
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
                                </div>
                            </div>

                            {error && (
                                <div className="error-alert">
                                    <div className="error-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="15" y1="9" x2="9" y2="15"/>
                                            <line x1="9" y1="9" x2="15" y2="15"/>
                                        </svg>
                                    </div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={!isFormValid || isLoading}
                                className="cosmic-submit-btn"
                            >
                                <div className="btn-content">
                                    {isLoading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <div className="btn-arrow">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M5 12h14"/>
                                                    <path d="M12 5l7 7-7 7"/>
                                                </svg>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="btn-glow"></div>
                            </button>
                        </form>

                        <div className="form-footer">
                            <div className="divider">
                                <span>New to Study Companion?</span>
                            </div>
                            <Link to="/register" className="cosmic-link">
                                <span>Create Account</span>
                                <div className="link-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M7 17l9.2-9.2M17 17V7H7"/>
                                    </svg>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;