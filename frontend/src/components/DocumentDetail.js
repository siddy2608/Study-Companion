import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDocumentById, getSummary, generateQuiz, askQuestion, generateFlashcards, retryTextExtraction } from '../services/api';
import ThemeToggle from './ThemeToggle';

// Enhanced Icons Components
const SummaryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

const FlashcardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-8.25A2.25 2.25 0 017.5 18v-2.25m8.25-8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25" />
    </svg>
);

const QnaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.627 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
);

// Enhanced loading spinner
const Spinner = () => (
    <div className="loading-state">
        <div className="spinner"></div>
        <p>AI is thinking...</p>
    </div>
);

// Welcome placeholder
const WelcomePlaceholder = () => (
    <div className="empty-state">
        <div className="empty-state-icon">🎯</div>
        <h3>AI Study Workspace</h3>
        <p>Select a tool from the toolbar above to begin your learning journey.</p>
    </div>
);

// Enhanced Flashcard Component
const Flashcard = ({ front, back }) => {
    const [flipped, setFlipped] = useState(false);
    
    return (
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="flashcard-inner">
                <div className="flashcard-front">
                    <p>{front}</p>
                </div>
                <div className="flashcard-back">
                    <p>{back}</p>
                </div>
            </div>
        </div>
    );
};

function DocumentDetail() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [activeView, setActiveView] = useState('summary');
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Cached data for each feature
    const [summary, setSummary] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [flashcards, setFlashcards] = useState(null);
    const [qna, setQna] = useState({ history: [], currentQuestion: '' });

    const [isLoading, setIsLoading] = useState(false);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    
    // State for retry text extraction
    const [isRetryingExtraction, setIsRetryingExtraction] = useState(false);
    const [retryMessage, setRetryMessage] = useState('');
    const [retryMessageType, setRetryMessageType] = useState(''); // 'success' or 'error'

    // Ref for auto-scrolling the chat history
    const chatHistoryRef = useRef(null);

    // Fetch the main document title on load
    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const response = await getDocumentById(id);
                setDoc(response.data);
            } catch (error) {
                console.error("Failed to fetch document details:", error);
            }
        };
        fetchDoc();
    }, [id]);

    // Auto-scroll chat history whenever new messages or loading state changes
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [qna.history, isLoading]);

    // Handle view changes and data loading
    const handleViewChange = useCallback(async (view) => {
        setActiveView(view);
        
        // Only load data if not already loaded for the view
        if (view === 'summary' && !summary) {
            setIsLoading(true);
            try {
                const res = await getSummary(id);
                setSummary(res.data.summary);
            } catch (error) {
                console.error("Failed to fetch summary:", error);
                
                // Handle rate limiting (429) with retry logic
                if (error.response?.status === 429) {
                    console.log("Rate limited, retrying in 2 seconds...");
                    setTimeout(async () => {
                        try {
                            const retryRes = await getSummary(id);
                            setSummary(retryRes.data.summary);
                        } catch (retryError) {
                            console.error("Retry failed:", retryError);
                            // Show user-friendly error message
                            setSummary("⚠️ Summary generation is in progress. Please wait a moment and try again.");
                        }
                    }, 2000);
                } else if (error.response?.status === 503 && error.response?.data?.fallback_mode) {
                    // AI is unavailable, using fallback
                    setSummary("🤖 AI is temporarily unavailable. Using basic summary instead.\n\n" + (error.response.data.error || ""));
                } else {
                    // Show user-friendly error message for other errors
                    setSummary("❌ Failed to generate summary. Please try again later.");
                }
            } finally {
                setIsLoading(false);
            }
        } else if (view === 'quiz' && !quiz) {
            setIsLoading(true);
            try {
                const res = await generateQuiz(id);
                setQuiz(res.data);
            } catch (error) {
                console.error("Failed to generate quiz:", error);
                
                // Handle rate limiting (429) with retry logic
                if (error.response?.status === 429) {
                    console.log("Rate limited, retrying in 2 seconds...");
                    setTimeout(async () => {
                        try {
                            const retryRes = await generateQuiz(id);
                            setQuiz(retryRes.data);
                        } catch (retryError) {
                            console.error("Retry failed:", retryError);
                            // Show user-friendly error message
                            setQuiz({ questions: [], message: "⚠️ Quiz generation is in progress. Please wait a moment and try again." });
                        }
                    }, 2000);
                } else if (error.response?.status === 503 && error.response?.data?.fallback_mode) {
                    // AI is unavailable, using fallback
                    setQuiz({ 
                        questions: [], 
                        message: "🤖 AI is temporarily unavailable. Using basic quiz instead.\n\n" + (error.response.data.error || "")
                    });
                } else {
                    // Show user-friendly error message for other errors
                    setQuiz({ questions: [], message: "❌ Failed to generate quiz. Please try again later." });
                }
            } finally {
                setIsLoading(false);
            }
        } else if (view === 'flashcards' && !flashcards) {
            setIsLoading(true);
            try {
                const res = await generateFlashcards(id);
                setFlashcards(res.data);
            } catch (error) {
                console.error("Failed to generate flashcards:", error);
                
                // Handle rate limiting (429) with retry logic
                if (error.response?.status === 429) {
                    console.log("Rate limited, retrying in 2 seconds...");
                    setTimeout(async () => {
                        try {
                            const retryRes = await generateFlashcards(id);
                            setFlashcards(retryRes.data);
                        } catch (retryError) {
                            console.error("Retry failed:", retryError);
                            // Show user-friendly error message
                            setFlashcards({ flashcards: [], message: "⚠️ Flashcard generation is in progress. Please wait a moment and try again." });
                        }
                    }, 2000);
                } else if (error.response?.status === 503 && error.response?.data?.fallback_mode) {
                    // AI is unavailable, using fallback
                    setFlashcards({ 
                        flashcards: [], 
                        message: "🤖 AI is temporarily unavailable. Using basic flashcards instead.\n\n" + (error.response.data.error || "")
                    });
                } else {
                    // Show user-friendly error message for other errors
                    setFlashcards({ flashcards: [], message: "❌ Failed to generate flashcards. Please try again later." });
                }
            } finally {
                setIsLoading(false);
            }
        }
    }, [id, summary, quiz, flashcards]);
    
    // Retry text extraction handler
    const handleRetryExtraction = async () => {
        setIsRetryingExtraction(true);
        setRetryMessage('');
        setRetryMessageType('');
        
        try {
            console.log(`Retrying text extraction for document ${id}...`);
            const response = await retryTextExtraction(id);
            
            if (response.data.success) {
                setRetryMessage('✅ Text extraction successful! AI features are now available.');
                setRetryMessageType('success');
                
                // Refresh document data to get the updated extracted_text
                const docResponse = await getDocumentById(id);
                setDoc(docResponse.data);
                
                // Clear any cached AI data so it regenerates with new text
                setSummary('');
                setQuiz(null);
                setFlashcards(null);
                setQna({ history: [], currentQuestion: '' });
                
                console.log('Text extraction retry successful, document updated');
            } else {
                setRetryMessage('❌ Text extraction failed again. The file might be corrupted or unsupported.');
                setRetryMessageType('error');
            }
        } catch (error) {
            console.error('Retry extraction failed:', error);
            setRetryMessage('❌ Failed to retry text extraction. Please try again later.');
            setRetryMessageType('error');
        } finally {
            setIsRetryingExtraction(false);
        }
    };
    
    // Initial load effect
    useEffect(() => {
        if (id && !initialLoadComplete) {
            // Just set the active view without automatically loading data
            // This prevents the 429 error from automatic summary generation
            setActiveView('summary');
            setInitialLoadComplete(true);
        }
    }, [id, initialLoadComplete]);

    // Q&A handlers
    const handleQnaSubmit = async (e) => {
        e.preventDefault();
        if (!qna.currentQuestion.trim()) return;
        
        const newQuestion = qna.currentQuestion;
        
        // Add user message to history and clear input
        setQna(prev => ({ 
            ...prev, 
            currentQuestion: '', 
            history: [...prev.history, { type: 'user', question: newQuestion }] 
        }));
        
        setIsLoading(true);
        
        try {
            const response = await askQuestion(id, newQuestion);
            // Add AI response as a separate message entry
            setQna(prev => ({
                ...prev,
                history: [...prev.history, { type: 'ai', question: newQuestion, answer: response.data.answer }]
            }));
        } catch (error) {
            console.error("Failed to get answer:", error);
            // Add error response as a separate AI message entry
            setQna(prev => ({
                ...prev,
                history: [...prev.history, { type: 'ai', question: newQuestion, answer: "Sorry, I couldn't process your question. Please try again." }]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // Load more handlers
    const handleLoadMoreQuiz = async () => {
        setIsMoreLoading(true);
        try {
            const res = await generateQuiz(id);
            if (res.data && res.data.questions && res.data.questions.questions) {
                setQuiz(prev => ({
                    ...prev,
                    questions: {
                        ...prev.questions,
                        questions: [...(prev.questions?.questions || []), ...res.data.questions.questions]
                    }
                }));
            }
        } catch (error) {
            console.error("Failed to generate more quiz questions:", error);
        } finally {
            setIsMoreLoading(false);
        }
    };

    const handleLoadMoreFlashcards = async () => {
        setIsMoreLoading(true);
        try {
            const res = await generateFlashcards(id);
            if (res.data && res.data.flashcards) {
                setFlashcards(prev => ({
                    ...prev,
                    flashcards: [...(prev.flashcards || []), ...res.data.flashcards]
                }));
            }
        } catch (error) {
            console.error("Failed to generate more flashcards:", error);
        } finally {
            setIsMoreLoading(false);
        }
    };

    const renderContent = () => {
        // Spinner for summary, quiz, flashcards
        if (isLoading && activeView !== 'qna') return <Spinner />;

        switch (activeView) {
            case 'summary':
                return (
                    <div className="content-padding">
                        <h3>📄 Document Summary</h3>
                        {summary ? (
                            <div style={{ 
                                background: 'var(--bg-secondary)', 
                                padding: 'var(--space-6)', 
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-primary)',
                                lineHeight: '1.7'
                            }}>
                                {summary}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📄</div>
                                <h3>No Summary Generated Yet</h3>
                                <p>Click "Generate Summary" to create an AI-powered summary of your document.</p>
                                <button 
                                    onClick={() => handleViewChange('summary')} 
                                    disabled={isLoading}
                                    className="generate-btn"
                                    style={{
                                        background: 'var(--primary-500)',
                                        color: 'white',
                                        border: 'none',
                                        padding: 'var(--space-3) var(--space-6)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: '500',
                                        marginTop: 'var(--space-4)'
                                    }}
                                >
                                    {isLoading ? (
                                        <span className="loading-content">
                                            <div className="spinner"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate Summary'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                );
            
            case 'quiz':
                return quiz && quiz.questions && quiz.questions.questions ? (
                    <div className="content-padding">
                        <h3>📝 Interactive Quiz</h3>
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)' }}>
                            Test your understanding with these AI-generated questions.
                        </p>
                        {quiz.questions.questions.map((q, index) => (
                            <div key={index} className="quiz-question">
                                <h4>{index + 1}. {q.question}</h4>
                                <ul className="quiz-options">
                                    {q.options.map((opt, i) => (
                                        <li key={i} className={`quiz-option ${opt === q.answer ? 'correct' : ''}`}>
                                            {opt} {opt === q.answer ? ' ✅' : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        
                        <div className="load-more-container">
                            <button onClick={handleLoadMoreQuiz} disabled={isMoreLoading} className="load-more-btn">
                                {isMoreLoading ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate More Questions'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="content-padding">
                        <div className="empty-state">
                            <div className="empty-state-icon">❓</div>
                            <h3>No Quiz Generated Yet</h3>
                            <p>Click "Generate Quiz" to create interactive questions from your document.</p>
                            <button 
                                onClick={() => handleViewChange('quiz')} 
                                disabled={isLoading}
                                className="generate-btn"
                                style={{
                                    background: 'var(--primary-500)',
                                    color: 'white',
                                    border: 'none',
                                    padding: 'var(--space-3) var(--space-6)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: '500',
                                    marginTop: 'var(--space-4)'
                                }}
                            >
                                {isLoading ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Quiz'
                                )}
                            </button>
                        </div>
                    </div>
                );
            
            case 'flashcards':
                return flashcards && flashcards.flashcards ? (
                    <div className="content-padding">
                        <h3>🎴 Study Flashcards</h3>
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)' }}>
                            Click on any card to flip it and reveal the answer.
                        </p>
                        <div className="flashcard-grid">
                            {flashcards.flashcards.map((card, index) => (
                                <Flashcard key={index} front={card.front} back={card.back} />
                            ))}
                        </div>
                        <div className="load-more-container">
                            <button onClick={handleLoadMoreFlashcards} disabled={isMoreLoading} className="load-more-btn">
                                {isMoreLoading ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate More Flashcards'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="content-padding">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎴</div>
                            <h3>No Flashcards Generated Yet</h3>
                            <p>Click "Generate Flashcards" to create interactive study cards from your document.</p>
                            <button 
                                onClick={() => handleViewChange('flashcards')} 
                                disabled={isLoading}
                                className="generate-btn"
                                style={{
                                    background: 'var(--primary-500)',
                                    color: 'white',
                                    border: 'none',
                                    padding: 'var(--space-3) var(--space-6)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: '500',
                                    marginTop: 'var(--space-4)'
                                }}
                            >
                                {isLoading ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Flashcards'
                                )}
                            </button>
                        </div>
                    </div>
                );
            
            case 'qna':
                return (
                    <div className="qna-container">
                        <h3 className="content-padding" style={{ paddingBottom: '0', marginBottom: '0'}}>
                            💬 Ask AI About Your Document
                        </h3>
                        <div className="qna-history" ref={chatHistoryRef}>
                            {qna.history.length === 0 && !isLoading && (
                                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 'var(--space-8)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', opacity: 0.5 }}>💭</div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Start a conversation!</p>
                                    <p>Ask me anything about your document and I'll help you understand it better.</p>
                                </div>
                            )}
                            {qna.history.map((pair, index) => (
                                <React.Fragment key={index}>
                                    {pair.type === 'user' && (
                                        <div className="qna-pair user">
                                            <div className="user-avatar">You</div>
                                            <div className="qna-bubble">
                                                {pair.question}
                                            </div>
                                        </div>
                                    )}
                                    {pair.type === 'ai' && pair.answer && (
                                        <div className="qna-pair ai">
                                            <div className="ai-avatar">AI</div>
                                            <div className="qna-bubble">
                                                {pair.answer}
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                            
                            {isLoading && (
                                <div className="qna-pair ai">
                                    <div className="ai-avatar">AI</div>
                                    <div className="qna-bubble">
                                        <div className="typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleQnaSubmit} className="qna-form">
                            <input
                                type="text"
                                value={qna.currentQuestion}
                                onChange={(e) => setQna(prev => ({ ...prev, currentQuestion: e.target.value }))}
                                placeholder="Ask me anything about this document..."
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                            <button type="submit" disabled={isLoading || !qna.currentQuestion.trim()} className="send-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </form>
                    </div>
                );
            
            default:
                return <WelcomePlaceholder />;
        }
    };
    
    if (!doc) {
        return <Spinner />;
    }
    
    return (
        <div className="workspace-container">
            <div className="workspace-header">
                <h2>📖 {doc.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <ThemeToggle />
                    <Link to="/dashboard" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
            
            {/* Text Extraction Retry Section */}
            {doc && doc.extracted_text && doc.extracted_text.startsWith("Text extraction failed:") && (
                <div style={{
                    background: 'var(--warning-bg, #fef3c7)',
                    border: '1px solid var(--warning-border, #f59e0b)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    margin: 'var(--space-4) var(--space-6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: '600', color: 'var(--warning-text, #92400e)' }}>
                                Text extraction failed
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--warning-text, #92400e)', opacity: 0.8 }}>
                                AI features won't work until text is extracted. Try the enhanced extraction method.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRetryExtraction}
                        disabled={isRetryingExtraction}
                        style={{
                            background: 'var(--warning-500, #f59e0b)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: isRetryingExtraction ? 'not-allowed' : 'pointer',
                            opacity: isRetryingExtraction ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {isRetryingExtraction ? (
                            <>
                                <span style={{ 
                                    display: 'inline-block', 
                                    width: '12px', 
                                    height: '12px', 
                                    border: '2px solid currentColor',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    marginRight: 'var(--space-2)',
                                    animation: 'spin 1s linear infinite'
                                }}></span>
                                Retrying...
                            </>
                        ) : (
                            '🔄 Retry Extraction'
                        )}
                    </button>
                </div>
            )}
            
            {/* Retry Result Message */}
            {retryMessage && (
                <div style={{
                    background: retryMessageType === 'success' ? 'var(--success-bg, #d1fae5)' : 'var(--error-bg, #fee2e2)',
                    border: `1px solid ${retryMessageType === 'success' ? 'var(--success-border, #10b981)' : 'var(--error-border, #ef4444)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    margin: 'var(--space-4) var(--space-6)',
                    color: retryMessageType === 'success' ? 'var(--success-text, #065f46)' : 'var(--error-text, #991b1b)',
                    fontWeight: '500'
                }}>
                    {retryMessage}
                </div>
            )}
            
            <div className="action-toolbar">
                <button 
                    className={`toolbar-button ${activeView === 'summary' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('summary')}
                >
                    <SummaryIcon />
                    <span>Summarize</span>
                </button>
                <button 
                    className={`toolbar-button ${activeView === 'quiz' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('quiz')}
                >
                    <QuizIcon />
                    <span>Generate Quiz</span>
                </button>
                <button 
                    className={`toolbar-button ${activeView === 'flashcards' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('flashcards')}
                >
                    <FlashcardIcon />
                    <span>Flashcards</span>
                </button>
                <button 
                    className={`toolbar-button ${activeView === 'qna' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('qna')}
                >
                    <QnaIcon />
                    <span>Ask Questions</span>
                </button>
            </div>

            <div className="content-area">
                {renderContent()}
            </div>
        </div>
    );
}

export default DocumentDetail;