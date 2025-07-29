import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentDetail from './components/DocumentDetail';
import RegisterPage from './pages/RegisterPage'; 
import VerifyOTPPage from './pages/VerifyOTPPage';
import './App.css'; 

const PrivateRoute = ({ children }) => {
    return localStorage.getItem('token') ? children : <Navigate to="/" />;
};

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <Router>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
                            <Route path="/register" element={<ErrorBoundary><RegisterPage /></ErrorBoundary>} />
                            <Route path="/verify-otp" element={<ErrorBoundary><VerifyOTPPage /></ErrorBoundary>} />
                            <Route path="/dashboard" element={<PrivateRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></PrivateRoute>} />
                            <Route path="/documents/:id" element={<PrivateRoute><ErrorBoundary><DocumentDetail /></ErrorBoundary></PrivateRoute>} />
                        </Routes>
                    </ErrorBoundary>
                </Router>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;