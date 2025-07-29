import React, { useState, useEffect } from 'react';
import { getDocumentTypes } from '../services/api';

function DocumentTypeFilter({ selectedTypeId, onTypeChange, showAll = true }) {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                setIsLoading(true);
                console.log('Fetching document types...');
                const response = await getDocumentTypes();
                console.log('Document types response:', response);
                console.log('Document types data:', response.data);
                setDocumentTypes(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch document types:', err);
                console.error('Error details:', err.response?.data);
                setError('Failed to load document types');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocumentTypes();
    }, []);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--gray-50)',
                color: 'var(--text-secondary)',
                fontSize: '14px'
            }}>
                <span>⏳</span>
                <span>Loading filters...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid var(--red-300)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--red-50)',
                color: 'var(--red-600)',
                fontSize: '14px'
            }}>
                <span>⚠️</span>
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
        }}>
            <span className="doc-type-filter-label" style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-secondary)'
            }}>
                Filter by type:
            </span>
            
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                {showAll && (
                    <button
                        className={`doc-type-filter-btn${selectedTypeId === null ? ' active' : ''}`}
                        onClick={() => {
                            console.log('Filter button clicked: All Documents (null)');
                            onTypeChange(null);
                        }}
                    >
                        📚 All Documents
                    </button>
                )}
                
                {documentTypes.map(type => (
                    <button
                        key={type.id}
                        className={`doc-type-filter-btn${selectedTypeId === type.id ? ' active' : ''}`}
                        onClick={() => {
                            console.log('Filter button clicked:', type.name, 'ID:', type.id);
                            onTypeChange(type.id);
                        }}
                    >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default DocumentTypeFilter; 