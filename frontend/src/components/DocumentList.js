import React from 'react';
import { Link } from 'react-router-dom';

function DocumentList({ documents, onDelete, isLoading }) {
    const getFileIcon = (document) => {
        // Use document type icon if available, otherwise fall back to file extension
        if (document.document_type && document.document_type.icon) {
            return document.document_type.icon;
        }
        
        const extension = document.title.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return '📄';
            case 'doc':
            case 'docx':
                return '📝';
            case 'txt':
                return '📃';
            case 'ppt':
            case 'pptx':
                return '📊';
            default:
                return '📋';
        }
    };

    const getDocumentTypeColor = (document) => {
        if (document.document_type && document.document_type.color) {
            return document.document_type.color;
        }
        return 'var(--gray-500)';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Recently';
        }
    };

    const truncateTitle = (title, maxLength = 50) => {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    };

    // Show loading state
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: 'var(--text-secondary)'
            }}>
                <div style={{
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '16px', fontSize: '2rem' }}>📚</div>
                    <div>Loading your documents...</div>
                </div>
            </div>
        );
    }

    // Show empty state
    if (!documents || documents.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: 'var(--text-secondary)'
            }}>
                <div style={{
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '16px', fontSize: '2rem' }}>📄</div>
                    <div>No documents uploaded yet</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>
                        Upload your first document to get started!
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="documents-grid">
            {documents.map(doc => (
                <div key={doc.id} className="document-card">
                    <div className="document-icon" style={{ fontSize: '2rem' }}>
                        {getFileIcon(doc)}
                    </div>
                    
                    <div className="document-title">
                        {truncateTitle(doc.title)}
                    </div>
                    
                    {/* Document Type Badge */}
                    {doc.document_type && (
                        <div style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            backgroundColor: `${getDocumentTypeColor(doc)}20`,
                            color: getDocumentTypeColor(doc),
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: '500',
                            marginBottom: '8px',
                            border: `1px solid ${getDocumentTypeColor(doc)}40`
                        }}>
                            {doc.document_type.icon} {doc.document_type.name}
                        </div>
                    )}
                    
                    <div className="document-meta">
                        <span>📅 Uploaded {formatDate(doc.uploaded_at)}</span>
                    </div>
                    
                    <div className="document-actions">
                        <Link 
                            to={`/documents/${doc.id}`}
                            className="btn btn-primary"
                            style={{ flex: 1, marginRight: '8px' }}
                        >
                            View
                        </Link>
                        <button
                            onClick={() => onDelete(doc.id)}
                            className="btn btn-danger"
                            style={{ flex: 1 }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DocumentList;