import React, { useState, useEffect } from 'react';

function UploadTrendsChart({ documents = [] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

    // Remove the useEffect that fetches documents since we get them as props

    const calculateUploadTrends = () => {
        const now = new Date();
        const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - (daysToShow * 24 * 60 * 60 * 1000));
        
        const dailyUploads = {};
        
        // Initialize all days with 0
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dateKey = date.toISOString().split('T')[0];
            dailyUploads[dateKey] = 0;
        }
        
        // Count uploads for each day
        documents.forEach(doc => {
            const uploadDate = new Date(doc.uploaded_at);
            if (uploadDate >= startDate) {
                const dateKey = uploadDate.toISOString().split('T')[0];
                if (dailyUploads[dateKey] !== undefined) {
                    dailyUploads[dateKey]++;
                }
            }
        });
        
        return Object.entries(dailyUploads).map(([date, count]) => ({
            date,
            count,
            label: new Date(date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            })
        }));
    };

    const uploadTrends = calculateUploadTrends();
    const totalUploads = uploadTrends.reduce((sum, day) => sum + day.count, 0);
    const maxUploads = Math.max(...uploadTrends.map(day => day.count), 1);

    if (isLoading) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">📈</div>
                    <div className="chart-title">Upload Trends</div>
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
                    <div className="chart-title">Upload Trends</div>
                    <div className="chart-subtitle">{error}</div>
                </div>
            </div>
        );
    }

    if (totalUploads === 0) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">📈</div>
                    <div className="chart-title">Upload Trends</div>
                    <div className="chart-subtitle">No uploads yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Upload documents to see trends
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
                    justifyContent: 'space-between',
                    marginBottom: '20px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="chart-icon">📈</div>
                        <div>
                            <div className="chart-title">Upload Trends</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                {totalUploads} uploads in {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['7d', '30d', '90d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                style={{
                                    padding: '4px 8px',
                                    border: timeRange === range 
                                        ? '1px solid var(--primary-500)' 
                                        : '1px solid var(--gray-300)',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: timeRange === range 
                                        ? 'var(--primary-50)' 
                                        : 'transparent',
                                    color: timeRange === range 
                                        ? 'var(--primary-600)' 
                                        : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'end', 
                    gap: '4px', 
                    height: '120px',
                    paddingBottom: '20px'
                }}>
                    {uploadTrends.map((day, index) => (
                        <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${(day.count / maxUploads) * 80}px`,
                                    backgroundColor: day.count > 0 ? 'var(--primary-500)' : 'var(--gray-200)',
                                    borderRadius: 'var(--radius-sm)',
                                    minHeight: '4px',
                                    transition: 'all 0.3s ease'
                                }}
                                title={`${day.label}: ${day.count} uploads`}
                            />
                            {index % (timeRange === '7d' ? 1 : timeRange === '30d' ? 5 : 15) === 0 && (
                                <div style={{ 
                                    fontSize: '10px', 
                                    color: 'var(--text-secondary)', 
                                    marginTop: '8px',
                                    transform: 'rotate(-45deg)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {day.label}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <div>
                        <strong>Peak Day:</strong> {uploadTrends.reduce((max, day) => day.count > max.count ? day : max).label}
                    </div>
                    <div>
                        <strong>Avg/Day:</strong> {(totalUploads / uploadTrends.length).toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadTrendsChart; 