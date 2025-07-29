import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console for debugging
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    margin: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--error-500, #ef4444)',
                    backgroundColor: 'var(--error-50, #fef2f2)',
                    color: 'var(--error-700, #b91c1c)',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--error-700, #b91c1c)' }}>
                        ⚠️ Something went wrong
                    </h2>
                    
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--error-500, #ef4444)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--error-600, #dc2626)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--error-500, #ef4444)';
                            }}
                        >
                            🔄 Refresh Page
                        </button>
                        
                        <button
                            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--gray-500, #6b7280)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--gray-600, #4b5563)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--gray-500, #6b7280)';
                            }}
                        >
                            🔄 Try Again
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                                🔍 Error Details (Development)
                            </summary>
                            <pre style={{
                                fontSize: '0.875rem',
                                overflow: 'auto',
                                backgroundColor: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-secondary)',
                                color: 'var(--text-secondary)'
                            }}>
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 