import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { smartSearch, getSearchSuggestions } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './SmartSearch.css';

function SmartSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchMode, setSearchMode] = useState('smart'); // 'smart' or 'basic'
    const [searchAnimation, setSearchAnimation] = useState(false);
    
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);
    
    // Cache for search results and suggestions to avoid duplicate API calls
    const searchCache = useRef(new Map());
    const suggestionsCache = useRef(new Map());
    const lastSearchQuery = useRef('');
    const lastSuggestionsQuery = useRef('');

    // Load search history from localStorage
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history.slice(0, 5)); // Keep only last 5 searches
    }, []);

    // Save search to history
    const saveToHistory = useCallback((searchQuery) => {
        const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }, [searchHistory]);

    // Debounce function for API calls
    const debounce = useCallback((func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }, []);

    // Fetch suggestions from API with caching
    const fetchSuggestions = useCallback(async (searchQuery) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Check cache first
        const cacheKey = searchQuery.toLowerCase().trim();
        if (suggestionsCache.current.has(cacheKey)) {
            const cachedSuggestions = suggestionsCache.current.get(cacheKey);
            setSuggestions(cachedSuggestions);
            setShowSuggestions(cachedSuggestions.length > 0);
            return;
        }

        // Prevent duplicate requests
        if (lastSuggestionsQuery.current === cacheKey) {
            return;
        }

        setIsFetchingSuggestions(true);
        lastSuggestionsQuery.current = cacheKey;
        
        try {
            const response = await getSearchSuggestions(searchQuery);
            const suggestionsList = response.data.suggestions || [];
            
            // Cache the results
            suggestionsCache.current.set(cacheKey, suggestionsList);
            
            // Limit cache size to prevent memory issues
            if (suggestionsCache.current.size > 50) {
                const firstKey = suggestionsCache.current.keys().next().value;
                suggestionsCache.current.delete(firstKey);
            }
            
            setSuggestions(suggestionsList);
            setShowSuggestions(suggestionsList.length > 0);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setIsFetchingSuggestions(false);
        }
    }, []);

    // Optimized debounced version
    const debouncedFetchSuggestions = useMemo(
        () => debounce(fetchSuggestions, 500),
        [fetchSuggestions, debounce]
    );

    // Handle input change
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedSuggestionIndex(-1);
        
        if (value.trim().length >= 2) {
            debouncedFetchSuggestions(value.trim());
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    }, [debouncedFetchSuggestions]);

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        if (query.trim().length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    }, [query, suggestions]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
                const selectedSuggestion = suggestions[selectedSuggestionIndex];
                setQuery(selectedSuggestion);
                setShowSuggestions(false);
                performSearch(selectedSuggestion);
            } else {
                handleSearch(e);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
    }, [showSuggestions, suggestions, selectedSuggestionIndex]);

    // Handle clicking outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform search function
    const performSearch = useCallback(async (searchQuery) => {
        const trimmedQuery = searchQuery.trim();
        
        if (!trimmedQuery || trimmedQuery.length < 3) return;

        // Check cache first
        const cacheKey = trimmedQuery.toLowerCase();
        if (searchCache.current.has(cacheKey)) {
            const cachedResults = searchCache.current.get(cacheKey);
            setResults(cachedResults);
            setShowSuggestions(false);
            saveToHistory(trimmedQuery);
            return;
        }

        // Prevent duplicate requests
        if (lastSearchQuery.current === cacheKey) {
            return;
        }

        setShowSuggestions(false);
        setIsLoading(true);
        setError('');
        setResults(null);
        setSearchAnimation(true);
        lastSearchQuery.current = cacheKey;

        try {
            const response = await smartSearch(trimmedQuery);
            const searchResults = response.data;
            
            // Cache the results
            searchCache.current.set(cacheKey, searchResults);
            
            // Limit cache size to prevent memory issues
            if (searchCache.current.size > 20) {
                const firstKey = searchCache.current.keys().next().value;
                searchCache.current.delete(firstKey);
            }
            
            setResults(searchResults);
            saveToHistory(trimmedQuery);
        } catch (err) {
            console.error('Search failed:', err);
            setError(err.response?.data?.error || 'Search failed. Please try again.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setSearchAnimation(false), 500);
        }
    }, [saveToHistory]);

    // Optimized search handler with caching and duplicate prevention
    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        await performSearch(query);
    }, [query, performSearch]);

    const handleDocumentClick = useCallback((docId) => {
        navigate(`/documents/${docId}`);
    }, [navigate]);

    const handleSuggestionClick = useCallback((suggestion) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        performSearch(suggestion);
    }, [performSearch]);

    const handleHistoryClick = useCallback((historyItem) => {
        setQuery(historyItem);
        performSearch(historyItem);
    }, [performSearch]);

    const getRelevanceColor = useCallback((score) => {
        if (score >= 8) return 'var(--success-500, #10b981)'; // green
        if (score >= 6) return 'var(--warning-500, #f59e0b)'; // amber
        return 'var(--gray-500, #6b7280)'; // gray
    }, []);

    const getRelevanceLabel = useCallback((score) => {
        if (score >= 8) return 'Highly Relevant';
        if (score >= 6) return 'Moderately Relevant';
        return 'Somewhat Relevant';
    }, []);

    const clearSearch = useCallback(() => {
        setQuery('');
        setResults(null);
        setError('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    }, []);

    // Clear caches when component unmounts or when needed
    useEffect(() => {
        const searchCacheRef = searchCache.current;
        const suggestionsCacheRef = suggestionsCache.current;
        
        return () => {
            searchCacheRef.clear();
            suggestionsCacheRef.clear();
        };
    }, []);

    return (
        <div className="smart-search-wrapper">
            {/* Search Header */}
            <div className="search-header">
                <div className="search-header-content">
                    <div className="search-title-section">
                        <h2 className="search-title">
                            <span className="search-icon">🔍</span>
                            Smart Search
                        </h2>
                        <p className="search-subtitle">Find anything in your documents using AI-powered search</p>
                    </div>
                    
                    {/* Search Mode Toggle */}
                    <div className="search-mode-toggle">
                        <button
                            className={`mode-btn ${searchMode === 'smart' ? 'active' : ''}`}
                            onClick={() => setSearchMode('smart')}
                        >
                            <span className="mode-icon">🤖</span>
                            AI Smart
                        </button>
                        <button
                            className={`mode-btn ${searchMode === 'basic' ? 'active' : ''}`}
                            onClick={() => setSearchMode('basic')}
                        >
                            <span className="mode-icon">📝</span>
                            Basic
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <div className="search-form-container">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-container">
                        <div className="search-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={handleInputFocus}
                                placeholder={searchMode === 'smart' ? "Ask anything about your documents..." : "Search documents..."}
                                className="search-input"
                                disabled={isLoading}
                            />
                            
                            {/* Search Mode Indicator */}
                            <div className="search-mode-indicator">
                                {searchMode === 'smart' ? '🤖' : '📝'}
                            </div>
                        </div>
                        
                        <div className="search-actions">
                            {query && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="clear-button"
                                    title="Clear search"
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            
                            <button
                                type="submit"
                                disabled={isLoading || !query.trim() || query.length < 3}
                                className={`search-button ${searchAnimation ? 'searching' : ''}`}
                                title="Search"
                            >
                                {isLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Suggestions dropdown */}
                {showSuggestions && (
                    <div ref={suggestionsRef} className="suggestions-container">
                        {/* Search History */}
                        {searchHistory.length > 0 && !query.trim() && (
                            <div className="suggestions-section">
                                <div className="suggestions-header">
                                    <span className="header-icon">🕒</span>
                                    Recent Searches
                                </div>
                                {searchHistory.map((historyItem, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleHistoryClick(historyItem)}
                                        className="history-item"
                                    >
                                        <svg className="history-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="history-text">{historyItem}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* AI Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="suggestions-section">
                                <div className="suggestions-header">
                                    <span className="header-icon">💡</span>
                                    AI Suggestions
                                </div>
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                                    >
                                        <svg className="suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="suggestion-text">{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Loading suggestions */}
                        {isFetchingSuggestions && (
                            <div className="suggestions-loading">
                                <div className="loading-spinner"></div>
                                <span>Generating suggestions...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h4 className="error-title">Search Error</h4>
                        <p className="error-text">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="loading-container">
                    <div className="loading-animation">
                        <div className="search-pulse"></div>
                        <div className="search-pulse"></div>
                        <div className="search-pulse"></div>
                    </div>
                    <div className="loading-content">
                        <h3 className="loading-title">Searching your documents...</h3>
                        <p className="loading-subtitle">AI is analyzing your content for the best matches</p>
                    </div>
                </div>
            )}

            {/* Search results */}
            {results && (
                <div className="results-section">
                    {/* Search Statistics */}
                    <div className="search-stats">
                        <div className="stats-header">
                            <h3 className="stats-title">Search Results</h3>
                            <div className="stats-summary">{results.search_summary}</div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{results.total_found || 0}</span>
                                <span className="stat-label">Total Results</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {results.results?.filter(r => r.relevance_score >= 8).length || 0}
                                </span>
                                <span className="stat-label">Highly Relevant</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {results.results?.filter(r => r.relevance_score >= 6 && r.relevance_score < 8).length || 0}
                                </span>
                                <span className="stat-label">Moderately Relevant</span>
                            </div>
                        </div>
                    </div>

                    {/* Results list */}
                    {results.results && results.results.length > 0 ? (
                        <div className="results-container">
                            {results.results.map((result, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleDocumentClick(result.document_id)}
                                    className="result-card"
                                    style={{ '--index': index }}
                                >
                                    <div className="result-header">
                                        <div className="result-title-section">
                                            <h3 className="result-title">{result.title}</h3>
                                            <div className="result-meta">
                                                <span className="result-id">ID: {result.document_id}</span>
                                            </div>
                                        </div>
                                        <div
                                            className="relevance-badge"
                                            style={{
                                                backgroundColor: `${getRelevanceColor(result.relevance_score)}20`,
                                                color: getRelevanceColor(result.relevance_score)
                                            }}
                                        >
                                            <div
                                                className="relevance-dot"
                                                style={{ backgroundColor: getRelevanceColor(result.relevance_score) }}
                                            ></div>
                                            <span className="relevance-score">{result.relevance_score}/10</span>
                                            <span className="relevance-label">{getRelevanceLabel(result.relevance_score)}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="result-snippet">{result.snippet}</p>
                                    
                                    <div className="result-actions">
                                        <button className="view-document-btn">
                                            <span>View Document</span>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <h3 className="no-results-title">No results found</h3>
                            <p className="no-results-text">
                                Try adjusting your search terms or use different keywords
                            </p>
                            <div className="no-results-suggestions">
                                <h4>Search Tips:</h4>
                                <ul>
                                    <li>Use specific keywords from your documents</li>
                                    <li>Try shorter or longer search phrases</li>
                                    <li>Check spelling and use synonyms</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SmartSearch; 