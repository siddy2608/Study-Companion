import React, { useState, useEffect } from 'react';
import { getDocumentTypes } from '../services/api';

function DocumentTypeSelector({ selectedTypeId, onTypeChange, showAutoDetect = true }) {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                setIsLoading(true);
                const response = await getDocumentTypes();
                setDocumentTypes(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch document types:', err);
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
                padding: '8px 12px',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--gray-50)',
                color: 'var(--text-secondary)',
                fontSize: '14px'
            }}>
                Loading document types...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '8px 12px',
                border: '1px solid var(--red-300)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--red-50)',
                color: 'var(--red-600)',
                fontSize: '14px'
            }}>
                {error}
            </div>
        );
    }

    return (
        <select
            value={selectedTypeId || ''}
            onChange={(e) => onTypeChange(e.target.value ? parseInt(e.target.value) : null)}
            style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                fontSize: '14px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
            }}
        >
            {showAutoDetect && (
                <option value="">🔍 Auto-detect from file type</option>
            )}
            {documentTypes.map(type => (
                <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                </option>
            ))}
        </select>
    );
}

export default DocumentTypeSelector; 