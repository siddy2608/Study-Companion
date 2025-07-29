import React, { useState, useEffect } from 'react';

function DocumentTypesChart({ documents = [] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Remove the useEffect that fetches documents since we get them as props

    const calculateDocumentTypes = () => {
        const typeCounts = {};
        let total = 0;

        documents.forEach(doc => {
            const typeName = doc.document_type ? doc.document_type.name : 'Unknown';
            typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
            total++;
        });

        return { typeCounts, total };
    };

    const { typeCounts, total } = calculateDocumentTypes();
    const sortedTypes = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Show top 5 types

    if (isLoading) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">📊</div>
                    <div className="chart-title">Document Types</div>
                    <div className="chart-subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">⚠️</div>
                    <div className="chart-title">Document Types</div>
                    <div className="chart-subtitle">{error}</div>
                </div>
            </div>
        );
    }

    if (total === 0) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">📊</div>
                    <div className="chart-title">Document Types</div>
                    <div className="chart-subtitle">No documents yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Upload documents to see analytics
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-card">
            <div style={{ padding: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '20px' 
                }}>
                    <div className="chart-icon">📊</div>
                    <div>
                        <div className="chart-title">Document Types</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {total} total documents
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sortedTypes.map(([typeName, count], index) => {
                        const percentage = ((count / total) * 100).toFixed(1);
                        const color = getTypeColor(typeName);
                        
                        return (
                            <div key={typeName} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    flexShrink: 0
                                }} />
                                <div style={{ flex: 1, fontSize: '14px' }}>
                                    {typeName}
                                </div>
                                <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '600',
                                    color: 'var(--text-primary)'
                                }}>
                                    {count}
                                </div>
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--text-secondary)',
                                    minWidth: '40px',
                                    textAlign: 'right'
                                }}>
                                    {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>

                {Object.keys(typeCounts).length > 5 && (
                    <div style={{ 
                        marginTop: '16px', 
                        padding: '8px 12px', 
                        backgroundColor: 'var(--gray-50)', 
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                    }}>
                        +{Object.keys(typeCounts).length - 5} more types
                    </div>
                )}
            </div>
        </div>
    );
}

function getTypeColor(typeName) {
    const colorMap = {
        'PDF Document': 'var(--error-500, #DC2626)',
        'Word Document': 'var(--info-500, #2563EB)',
        'Text Document': 'var(--success-500, #059669)',
        'PowerPoint Presentation': 'var(--error-500, #DC2626)',
        'Excel Spreadsheet': 'var(--success-500, #059669)',
        'Research Paper': 'var(--secondary-500, #7C3AED)',
        'Lecture Notes': 'var(--warning-500, #F59E0B)',
        'Study Guide': 'var(--success-500, #10B981)',
        'Other Document': 'var(--gray-500, #6B7280)',
        'Unknown': 'var(--gray-400, #9CA3AF)'
    };
    
    return colorMap[typeName] || 'var(--gray-500, #6B7280)';
}

export default DocumentTypesChart; 