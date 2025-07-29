import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
        console.log('🔐 Adding auth token to request:', config.url);
    } else {
        console.warn('⚠️ No auth token found for request:', config.url);
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
    response => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
    },
    error => {
        console.error('❌ API Error:', error.config?.url, error.response?.status);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            console.error('🚨 Authentication failed - redirecting to login');
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = '/';
        }
        
        return Promise.reject(error);
    }
);

export const login = (username, password) => {
    return apiClient.post('/auth/token/', { username, password });
};

export const register = (userData) => {
    return apiClient.post('/auth/register/', userData);
};

export const verifyOTP = (email, otp) => {
    return apiClient.post('/auth/verify-otp/', { email, otp });
};

export const validateToken = () => {
    return apiClient.get('/auth/validate-token/');
};

export const getUserProfile = () => {
    return apiClient.get('/auth/validate-token/');
};

// Document Types API
export const getDocumentTypes = () => {
    return apiClient.get('/document-types/');
};

export const createDocumentType = (documentTypeData) => {
    return apiClient.post('/document-types/create/', documentTypeData);
};

export const updateDocumentType = (id, documentTypeData) => {
    return apiClient.put(`/document-types/${id}/`, documentTypeData);
};

export const deleteDocumentType = (id) => {
    return apiClient.delete(`/document-types/${id}/`);
};

// Documents API with type filtering
export const getDocuments = (documentTypeId = null, signal = null) => {
    const params = {
        _t: Date.now() // Add timestamp to prevent caching
    };
    
    if (documentTypeId) {
        params.document_type = documentTypeId;
    }
    
    const config = { params };
    if (signal) {
        config.signal = signal;
    }
    
    return apiClient.get('/documents/', config);
};

export const getDocumentById = (id) => {
    return apiClient.get(`/documents/${id}/`);
}

export const uploadDocument = (formData) => {
    return apiClient.post('/documents/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteDocument = (id) => {
    return apiClient.delete(`/documents/${id}/`);
};

export const getSummary = (docId) => {
    return apiClient.post(`/documents/${docId}/summarize/`);
};

export const generateQuiz = (docId) => {
    return apiClient.post(`/documents/${docId}/generate-quiz/`);
};

// --- ADD THIS NEW FUNCTION ---
export const generateFlashcards = (docId) => {
    return apiClient.post(`/documents/${docId}/generate-flashcards/`);
};
// --------------------------

export const askQuestion = (docId, question) => {
    return apiClient.post(`/documents/${docId}/qna/`, { question });
};

export const retryTextExtraction = (docId) => {
    return apiClient.post(`/documents/${docId}/retry-extraction/`);
};

// Smart Search
export const smartSearch = (query) => {
    return apiClient.post('/documents/search/', { query });
};

// Search Suggestions for autocomplete
export const getSearchSuggestions = (query) => {
    return apiClient.post('/documents/search/suggestions/', { query });
};
