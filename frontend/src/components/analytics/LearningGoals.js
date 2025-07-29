import React, { useState, useEffect } from 'react';

function LearningGoals({ documents = [] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [goals, setGoals] = useState([
        { id: 1, name: 'Upload 10 documents', target: 10, current: 0, icon: '📚' },
        { id: 2, name: 'Study for 7 days', target: 7, current: 0, icon: '📅' },
        { id: 3, name: 'Use AI features', target: 5, current: 0, icon: '🤖' },
        { id: 4, name: 'Organize by type', target: 3, current: 0, icon: '🏷️' }
    ]);

    // Remove the useEffect that fetches documents since we get them as props

    useEffect(() => {
        if (documents.length > 0) {
            calculateGoals();
        }
    }, [documents]);

    const calculateGoals = () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        // Calculate current progress
        const totalDocs = documents.length;
        const recentDocs = documents.filter(doc => new Date(doc.uploaded_at) >= sevenDaysAgo).length;
        const uniqueTypes = new Set(documents.map(doc => doc.document_type?.name).filter(Boolean)).size;
        
        // Estimate AI usage (documents with extracted text)
        const aiUsedDocs = documents.filter(doc => 
            doc.extracted_text && 
            !doc.extracted_text.startsWith("Text extraction failed:")
        ).length;

        setGoals([
            { id: 1, name: 'Upload 10 documents', target: 10, current: Math.min(totalDocs, 10), icon: '📚' },
            { id: 2, name: 'Study for 7 days', target: 7, current: Math.min(recentDocs, 7), icon: '📅' },
            { id: 3, name: 'Use AI features', target: 5, current: Math.min(aiUsedDocs, 5), icon: '🤖' },
            { id: 4, name: 'Organize by type', target: 3, current: Math.min(uniqueTypes, 3), icon: '🏷️' }
        ]);
    };

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return 'var(--success-500, #10B981)'; // Green
        if (percentage >= 70) return 'var(--warning-500, #F59E0B)'; // Yellow
        if (percentage >= 40) return 'var(--info-500, #3B82F6)'; // Blue
        return 'var(--gray-500, #6B7280)'; // Gray
    };

    const getProgressEmoji = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return '🎉';
        if (percentage >= 70) return '🔥';
        if (percentage >= 40) return '📈';
        return '🚀';
    };

    if (isLoading) {
        return (
            <div className="analytics-card">
                <div className="chart-placeholder">
                    <div className="chart-icon">🎯</div>
                    <div className="chart-title">Learning Goals</div>
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
                    <div className="chart-title">Learning Goals</div>
                    <div className="chart-subtitle">{error}</div>
                </div>
            </div>
        );
    }

    const completedGoals = goals.filter(goal => goal.current >= goal.target).length;
    const totalGoals = goals.length;

    return (
        <div className="analytics-card learning-goal-card">
            <div style={{ padding: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '20px' 
                }}>
                    <div className="chart-icon">🎯</div>
                    <div>
                        <div className="chart-title">Learning Goals</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {completedGoals}/{totalGoals} goals completed
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {goals.map(goal => {
                        const percentage = Math.min((goal.current / goal.target) * 100, 100);
                        const isCompleted = goal.current >= goal.target;
                        
                        return (
                            <div key={goal.id} style={{ 
                                padding: '16px', 
                                border: '1px solid var(--gray-200)', 
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isCompleted ? 'var(--green-50)' : 'white'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>{goal.icon}</span>
                                        <span style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '500',
                                            color: isCompleted ? 'var(--green-700)' : 'var(--text-primary)'
                                        }}>
                                            {goal.name}
                                        </span>
                                    </div>
                                    <div style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600',
                                        color: getProgressColor(goal.current, goal.target)
                                    }}>
                                        {getProgressEmoji(goal.current, goal.target)}
                                    </div>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{ 
                                        flex: 1, 
                                        height: '8px', 
                                        backgroundColor: 'var(--gray-200)', 
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            backgroundColor: getProgressColor(goal.current, goal.target),
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        fontWeight: '600',
                                        color: getProgressColor(goal.current, goal.target),
                                        minWidth: '40px',
                                        textAlign: 'right'
                                    }}>
                                        {goal.current}/{goal.target}
                                    </div>
                                </div>

                                {isCompleted && (
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: 'var(--green-600)',
                                        fontWeight: '500'
                                    }}>
                                        ✅ Goal achieved!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {completedGoals === totalGoals && (
                    <div style={{ 
                        marginTop: '16px', 
                        padding: '12px', 
                        backgroundColor: 'var(--green-50)', 
                        border: '1px solid var(--green-200)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--green-700)' }}>
                            🎉 All goals completed!
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--green-600)', marginTop: '4px' }}>
                            You're on fire! Keep up the great work!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LearningGoals; 