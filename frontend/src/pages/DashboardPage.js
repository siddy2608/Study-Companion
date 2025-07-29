import React, { useState, useEffect, useRef, useCallback } from 'react';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';
import SmartSearch from '../components/SmartSearch';
import ThemeToggle from '../components/ThemeToggle';
import DocumentTypeFilter from '../components/DocumentTypeFilter';
import DocumentTypesChart from '../components/analytics/DocumentTypesChart';
import UploadTrendsChart from '../components/analytics/UploadTrendsChart';
import LearningGoals from '../components/analytics/LearningGoals';
import './DashboardPage.css';

import { getDocuments, deleteDocument, getUserProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
    const [activeSection, setActiveSection] = useState('overview');
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState(null);
    const [stats, setStats] = useState({
        totalDocs: 0,
        recentUploads: 0,
        totalSize: 0
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Add debouncing for API calls
    const fetchTimeoutRef = useRef(null);
    const lastFetchRef = useRef(null);
    const documentsCacheRef = useRef({});
    const abortControllerRef = useRef(null);
    
    const navigate = useNavigate();

    // Memoized fetch function for better performance
    const fetchDocuments = useCallback(async (documentTypeId = null) => {
        // Clear any existing timeout and abort previous requests
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Check cache first
        const cacheKey = documentTypeId || 'all';
        if (documentsCacheRef.current[cacheKey] && 
            (Date.now() - documentsCacheRef.current[cacheKey].timestamp) < 30000) { // 30 second cache
            console.log('Using cached documents for:', cacheKey);
            setDocuments(documentsCacheRef.current[cacheKey].data);
            return;
        }

        // Check if we're making the same request too quickly
        const now = Date.now();
        const lastFetch = lastFetchRef.current;
        if (lastFetch && (now - lastFetch) < 2000) { // Increased to 2 seconds
            console.log('Request throttled - too soon since last fetch');
            return;
        }

        // Debounce the request
        fetchTimeoutRef.current = setTimeout(async () => {
            try {
                setIsLoading(true);
                setError(null);
                lastFetchRef.current = Date.now();
                
                // Create new abort controller for this request
                abortControllerRef.current = new AbortController();
                
                console.log('=== FETCHING DOCUMENTS ===');
                console.log('Document type filter:', documentTypeId);
                console.log('Clearing current documents state...');
                setDocuments([]);
                
                const response = await getDocuments(documentTypeId, abortControllerRef.current.signal);
                console.log('Raw server response:', response);
                console.log(`Server returned ${response.data.length} documents`);
                console.log('Full document list from server:', response.data);
                response.data.forEach(doc => {
                    console.log(`Document ID ${doc.id}: "${doc.title}" (uploaded: ${doc.uploaded_at})`);
                });
                
                // Cache the result
                documentsCacheRef.current[cacheKey] = {
                    data: response.data,
                    timestamp: Date.now()
                };
                
                setDocuments(response.data);
                
                // Calculate stats
                const today = new Date();
                const recentUploads = response.data.filter(doc => {
                    const uploadDate = new Date(doc.uploaded_at);
                    const diffTime = Math.abs(today - uploadDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                }).length;
                
                setStats({
                    totalDocs: response.data.length,
                    recentUploads: recentUploads,
                    totalSize: response.data.reduce((acc, doc) => acc + (doc.file_size || 0), 0)
                });
                
                console.log('Documents state updated');
                console.log('=== FETCH COMPLETE ===');
            } catch (error) {
                // Don't set error if request was aborted
                if (error.name === 'AbortError') {
                    console.log('Request was aborted');
                    return;
                }
                
                console.error("=== FETCH DOCUMENTS FAILED ===");
                console.error("Failed to fetch documents:", error);
                console.error("Error response:", error.response?.data);
                
                if (error.response?.status === 429) {
                    setError("Too many requests. Please wait a moment and try again.");
                    console.log("Rate limited - will retry automatically in 5 seconds");
                    // Retry after 5 seconds
                    setTimeout(() => {
                        fetchDocuments(documentTypeId);
                    }, 5000);
                } else {
                    setError("Failed to load documents. Please try again.");
                    setDocuments([]);
                }
            } finally {
                setIsLoading(false);
                console.log('fetchDocuments finally block completed');
            }
        }, 1000); // Increased to 1 second debounce delay
    }, []);

    // Add keyboard shortcut for sidebar toggle
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+B (Windows/Linux) or Cmd+B (Mac) to toggle sidebar
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault();
                setSidebarCollapsed(!sidebarCollapsed);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sidebarCollapsed]);

    // Fetch user profile on component mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await getUserProfile();
                setUser(response.data);
                console.log('User profile loaded:', response.data);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                // If user profile fetch fails, redirect to login
                localStorage.removeItem('token');
                navigate('/');
            }
        };

        fetchUserProfile();
    }, [navigate]);

    useEffect(() => {
        fetchDocuments(selectedDocumentTypeId);
        
        // Cleanup function to abort requests when component unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [selectedDocumentTypeId, fetchDocuments]);

    const handleDocumentTypeChange = useCallback((documentTypeId) => {
        console.log('Document type filter changed to:', documentTypeId);
        setSelectedDocumentTypeId(documentTypeId);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        navigate('/');
    }, [navigate]);

    const clearCache = useCallback(() => {
        documentsCacheRef.current = {};
        console.log('Documents cache cleared');
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        clearCache();
        try {
            await fetchDocuments(selectedDocumentTypeId);
        } finally {
            setIsRefreshing(false);
        }
    }, [selectedDocumentTypeId, fetchDocuments, clearCache]);

    const handleDeleteDocument = useCallback(async (docId) => {
        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            console.log(`Attempting to delete document ID: ${docId}`);
            
            try {
                const response = await deleteDocument(docId);
                console.log(`Delete response:`, response);
                console.log(`Document ${docId} deleted successfully`);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`Document ${docId} was already deleted from database - removing from UI`);
                } else {
                    console.error("Failed to delete document:", error);
                    console.error("Error details:", error.response?.data);
                    alert("There was an error deleting the document.");
                    return;
                }
            }
            
            // Clear cache and refresh
            clearCache();
            console.log('Refreshing document list from server...');
            await fetchDocuments(selectedDocumentTypeId);
        }
    }, [selectedDocumentTypeId, fetchDocuments, clearCache]);

    const formatFileSize = useCallback((bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    const sidebarItems = [
        // Main Navigation
        { id: 'overview', icon: '📊', label: 'Overview', description: 'Dashboard overview' },
        { id: 'upload', icon: '📤', label: 'Upload', description: 'Add new documents' },
        { id: 'documents', icon: '📄', label: 'Library', description: 'All documents' },
        
        // Tools & Analytics
        { id: 'search', icon: '🔍', label: 'Smart Search', description: 'AI-powered search' },
        { id: 'analytics', icon: '📈', label: 'Analytics', description: 'Usage insights' }
    ];

    return (
        <div className="modern-dashboard">
            {/* Sidebar Navigation */}
            <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-logo-modern">
                        <div className="logo-icon-modern">🧠</div>
                        {!sidebarCollapsed && (
                            <div className="brand-name-modern">StudyCompanion</div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav-modern">
                    {/* Main Navigation */}
                    <div className="nav-section">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item-modern ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                                title={item.label}
                            >
                                <span className="nav-icon-modern">{item.icon}</span>
                                {!sidebarCollapsed && (
                                    <div className="nav-content-modern">
                                        <span className="nav-label-modern">{item.label}</span>
                                        <span className="nav-description-modern">{item.description}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer-modern">
                    {!sidebarCollapsed && (
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            © 2024 StudyCompanion
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Top Bar */}
                <div className="dashboard-topbar">
                    <div className="topbar-left">
                        <button 
                            className={`topbar-toggle-btn ${sidebarCollapsed ? 'active' : ''}`}
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={`${sidebarCollapsed ? "Expand" : "Collapse"} Sidebar (Ctrl+B)`}
                        >
                            {sidebarCollapsed ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            )}
                        </button>
                        <h1 className="page-title">
                            {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                        </h1>
                        <div className="breadcrumb">
                            <span>Study Companion</span>
                            <span className="separator">→</span>
                            <span>{sidebarItems.find(item => item.id === activeSection)?.label}</span>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="user-profile">
                            <div className="user-avatar">
                                <span>{user?.username ? user.username.charAt(0).toUpperCase() : '👤'}</span>
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.username || 'Student'}</span>
                                <span className="user-status">Active</span>
                            </div>
                            <ThemeToggle />
                            <button 
                                className="logout-btn" 
                                onClick={handleLogout}
                                title="Logout"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16,17 21,12 16,7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="dashboard-content">
                    {activeSection === 'overview' && (
                        <div className="overview-section">
                            {/* Stats Cards */}
                            <div className="stats-grid">
                                <div className="stat-card documents-card">
                                    <div className="stat-icon">📄</div>
                                    <div className="stat-content">
                                        <div className="stat-number">{stats.totalDocs}</div>
                                        <div className="stat-label">Total Documents</div>
                                        <div className="stat-trend">↗ All your files</div>
                                    </div>
                                    <div className="stat-glow"></div>
                                </div>

                                <div className="stat-card recent-card">
                                    <div className="stat-icon">🆕</div>
                                    <div className="stat-content">
                                        <div className="stat-number">{stats.recentUploads}</div>
                                        <div className="stat-label">Recent Uploads</div>
                                        <div className="stat-trend">📅 Last 7 days</div>
                                    </div>
                                    <div className="stat-glow"></div>
                                </div>

                                <div className="stat-card storage-card">
                                    <div className="stat-icon">💾</div>
                                    <div className="stat-content">
                                        <div className="stat-number">{formatFileSize(stats.totalSize)}</div>
                                        <div className="stat-label">Total Storage</div>
                                        <div className="stat-trend">📊 Used space</div>
                                    </div>
                                    <div className="stat-glow"></div>
                                </div>

                                <div className="stat-card ai-card">
                                    <div className="stat-icon">🤖</div>
                                    <div className="stat-content">
                                        <div className="stat-number">AI</div>
                                        <div className="stat-label">Smart Features</div>
                                        <div className="stat-trend">🧠 Powered by Gemini</div>
                                    </div>
                                    <div className="stat-glow"></div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="quick-actions">
                                <h3 className="section-title">Quick Actions</h3>
                                <div className="action-grid">
                                    <button 
                                        className="action-card upload-action"
                                        onClick={() => setActiveSection('upload')}
                                    >
                                        <div className="action-icon">📤</div>
                                        <div className="action-content">
                                            <div className="action-title">Upload Document</div>
                                            <div className="action-subtitle">Add new study material</div>
                                        </div>
                                        <div className="action-arrow">→</div>
                                    </button>

                                    <button 
                                        className="action-card search-action"
                                        onClick={() => setActiveSection('search')}
                                    >
                                        <div className="action-icon">🔍</div>
                                        <div className="action-content">
                                            <div className="action-title">Smart Search</div>
                                            <div className="action-subtitle">Find anything instantly</div>
                                        </div>
                                        <div className="action-arrow">→</div>
                                    </button>

                                    <button 
                                        className="action-card library-action"
                                        onClick={() => setActiveSection('documents')}
                                    >
                                        <div className="action-icon">📚</div>
                                        <div className="action-content">
                                            <div className="action-title">Browse Library</div>
                                            <div className="action-subtitle">View all documents</div>
                                        </div>
                                        <div className="action-arrow">→</div>
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="recent-activity">
                                <h3 className="section-title">Recent Activity</h3>
                                <div className="activity-list">
                                    {documents.slice(0, 3).map(doc => (
                                        <div key={doc.id} className="activity-item">
                                            <div className="activity-icon">📄</div>
                                            <div className="activity-content">
                                                <div className="activity-title">{doc.title}</div>
                                                <div className="activity-subtitle">
                                                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="activity-status">✅</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'search' && (
                        <div className="search-section">
                            <div className="section-header">
                                <h3 className="section-title">AI-Powered Smart Search</h3>
                                <p className="section-subtitle">Find anything in your documents using natural language</p>
                            </div>
                            <div className="content-card">
                                <SmartSearch />
                            </div>
                        </div>
                    )}

                    {activeSection === 'upload' && (
                        <div className="upload-section-modern">
                            <div className="section-header">
                                <h3 className="section-title">Upload New Document</h3>
                                <p className="section-subtitle">Add study materials to your personal library</p>
                            </div>
                            <div className="upload-card">
                                <div className="upload-visual">
                                    <div className="upload-icon-large">📤</div>
                                    <div className="upload-animation"></div>
                                </div>
                                <DocumentUpload onUploadSuccess={() => {
                                    clearCache();
                                    fetchDocuments(selectedDocumentTypeId);
                                }} />
                            </div>
                        </div>
                    )}

                    {activeSection === 'documents' && (
                        <div className="documents-section">
                            <div className="section-header">
                                <h3 className="section-title">Document Library</h3>
                                <p className="section-subtitle">Manage and organize your study materials</p>
                                <button 
                                    className="refresh-btn"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    title="Refresh documents"
                                >
                                    {isRefreshing ? '🔄' : '🔄'}
                                </button>
                            </div>
                            
                            {/* Document Type Filter */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <DocumentTypeFilter
                                    selectedTypeId={selectedDocumentTypeId}
                                    onTypeChange={handleDocumentTypeChange}
                                    showAll={true}
                                />
                            </div>
                            
                            <div className="content-card">
                                {error && (
                                    <div style={{
                                        padding: '16px',
                                        marginBottom: '16px',
                                        backgroundColor: 'var(--error-50)',
                                        border: '1px solid var(--error-200)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--error-700)',
                                        fontSize: '14px'
                                    }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                <DocumentList 
                                    documents={documents} 
                                    isLoading={isLoading} 
                                    onDelete={handleDeleteDocument}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'analytics' && (
                        <div className="analytics-section">
                            <div className="section-header">
                                <h3 className="section-title">Usage Analytics</h3>
                                <p className="section-subtitle">Insights about your learning patterns</p>
                            </div>
                            <div className="analytics-grid">
                                <DocumentTypesChart documents={documents} />
                                <UploadTrendsChart documents={documents} />
                                <LearningGoals documents={documents} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="floating-actions">
                <button 
                    className="fab main-fab"
                    onClick={() => setActiveSection('upload')}
                    title="Quick Upload"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default DashboardPage;