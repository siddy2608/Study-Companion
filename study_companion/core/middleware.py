import logging
import time
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class APIUsageMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware to monitor API usage and prevent abuse
    """
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.ai_endpoints = [
            '/api/documents/',
            '/summarize/',
            '/generate-quiz/',
            '/generate-flashcards/',
            '/qna/',
            '/search/',
            '/search/suggestions/'
        ]
    
    def process_request(self, request):
        # Track API usage for authenticated users
        # Check if user attribute exists (should be added by AuthenticationMiddleware)
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Rate limiting for AI endpoints
            is_ai_endpoint = any(endpoint in request.path for endpoint in self.ai_endpoints)
            
            if is_ai_endpoint:
                # Check rate limit per user per hour
                rate_limit_key = f"api_usage_{request.user.id}_{time.strftime('%Y%m%d%H')}"
                current_usage = cache.get(rate_limit_key, 0)
                
                # Limit to 50 AI API calls per hour per user
                if current_usage >= 50:
                    logger.warning(f"Rate limit exceeded for user {request.user.id} on {request.path}")
                    return JsonResponse({
                        "error": "API rate limit exceeded. Please wait before making more requests.",
                        "limit": "50 requests per hour for AI features"
                    }, status=429)
                
                # Increment usage counter
                cache.set(rate_limit_key, current_usage + 1, timeout=3600)
    
    def process_response(self, request, response):
        # Log API usage for monitoring
        if hasattr(request, 'user') and request.user.is_authenticated:
            is_ai_endpoint = any(endpoint in request.path for endpoint in self.ai_endpoints)
            
            if is_ai_endpoint:
                logger.info(f"AI API usage - User: {request.user.id}, Endpoint: {request.path}, Status: {response.status_code}")
        
        return response

class ComponentStabilityMiddleware(MiddlewareMixin):
    """
    Middleware to enhance component stability and error handling
    """
    
    def process_exception(self, request, exception):
        # Log all exceptions for monitoring
        logger.error(f"Unhandled exception in {request.path}: {str(exception)}", exc_info=True)
        
        # Return consistent error response format
        if '/api/' in request.path:
            return JsonResponse({
                "error": "An unexpected error occurred. Please try again later.",
                "status": "error"
            }, status=500)
        
        return None 