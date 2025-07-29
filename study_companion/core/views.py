# study_companion/core/views.py

from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, generics, views
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .services import (
    extract_text_from_file, get_gemini_summary,
    get_gemini_quiz, get_gemini_flashcards, get_gemini_answer,
    smart_search_documents, generate_search_suggestions
)
from .models import UploadedDocument, Quiz, FlashcardSet, Flashcard, TemporaryUser, QuestionAnswer, SearchCache, DocumentType
from .serializers import (
    UploadedDocumentSerializer,
    QuizSerializer, FlashcardSetSerializer, DocumentTypeSerializer
)
import random
import logging
import hashlib
import json
from datetime import timedelta

# --- Authentication Views ---

class RegisterView(views.APIView):
    # Explicitly allow any permissions AND no authentication for this public endpoint
    authentication_classes = [] # <--- ADD THIS LINE
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        # It's good practice to normalize email for case-insensitive checks
        normalized_email = email.lower()

        if User.objects.filter(username__iexact=username).exists() or User.objects.filter(email__iexact=normalized_email).exists():
            return Response({"error": "Username or email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        hashed_password = make_password(password)
        otp_code = ''.join(random.choices('0123456789', k=6))

        # Use normalized_email for TemporaryUser as well for consistency
        TemporaryUser.objects.update_or_create(
            email=normalized_email, # Use normalized email here
            defaults={
                'username': username,
                'password': hashed_password,
                'otp': otp_code
            }
        )

        send_mail(
            'Your Account Verification Code',
            f'Your OTP code is: {otp_code}',
            settings.DEFAULT_FROM_EMAIL,
            [email], # Send to original email for user
            fail_silently=False,
        )

        return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)


class VerifyOTPView(views.APIView):
    # Explicitly allow any permissions AND no authentication for this public endpoint
    authentication_classes = [] # <--- ADD THIS LINE
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_code = request.data.get('otp')

        if not email or not otp_code:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize email when fetching from TemporaryUser
        normalized_email = email.lower()
        try:
            temp_user = TemporaryUser.objects.get(email=normalized_email)
        except TemporaryUser.DoesNotExist:
            return Response({"error": "Invalid request. Please register again."}, status=status.HTTP_404_NOT_FOUND)

        if temp_user.is_otp_expired():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

        if temp_user.otp == otp_code:
            # Create the actual Django User
            user = User.objects.create(
                username=temp_user.username,
                email=temp_user.email, # Use the email stored in temp_user
                password=temp_user.password, # This is already hashed
                is_active=True
            )

            token, _ = Token.objects.get_or_create(user=user)
            temp_user.delete()

            return Response({"message": "Account created successfully.", "token": token.key}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

class CustomAuthToken(ObtainAuthToken):
    # This view typically *needs* authentication, as it's for logging in.
    # It might use SessionAuthentication for browser-based logins or basic auth.
    # If using TokenAuthentication here, it's usually expected that the client
    # provides credentials (username/password) to get a token.
    # It usually does not need explicit `authentication_classes = []` or `permission_classes = [AllowAny]`
    # as its purpose is to perform authentication.
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if not user.is_active:
            return Response({"error": "Account not activated. Please verify your OTP."}, status=status.HTTP_401_UNAUTHORIZED)
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user_id': user.pk})

class ValidateTokenView(views.APIView):
    """
    Simple token validation endpoint to prevent 404 errors
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        # If we reach here, the token is valid (IsAuthenticated ensures this)
        return Response({
            "valid": True,
            "user_id": request.user.id,
            "username": request.user.username,
            "email": request.user.email
        }, status=status.HTTP_200_OK)
    
    def post(self, request, *args, **kwargs):
        # Same as GET for consistency
        return self.get(request, *args, **kwargs)

# --- Document & AI Views (These should generally require IsAuthenticated) ---

class DocumentUploadView(generics.CreateAPIView):
    queryset = UploadedDocument.objects.all()
    serializer_class = UploadedDocumentSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        document = serializer.save(user=self.request.user)
        try:
            extracted_text = extract_text_from_file(document.file.path)
            document.extracted_text = extracted_text
            document.save()
            print(f"Text extraction successful for document: {document.title}")
        except Exception as e:
            print(f"Text extraction failed for document: {document.title}, Error: {e}")
            # Don't delete the document - just save it without extracted text
            # Users can still upload the file and manually add content later
            document.extracted_text = f"Text extraction failed: {str(e)}"
            document.save()
            print(f"Document saved without text extraction: {document.title}")

class DocumentTypeListView(generics.ListAPIView):
    """List all available document types"""
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DocumentType.objects.all()

class DocumentTypeCreateView(generics.CreateAPIView):
    """Create a new document type (admin only)"""
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save()

class DocumentTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a document type"""
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DocumentType.objects.all()

class DocumentListView(generics.ListAPIView):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = UploadedDocument.objects.filter(user=self.request.user)
        
        # Filter by document type if provided
        document_type_id = self.request.query_params.get('document_type', None)
        if document_type_id:
            queryset = queryset.filter(document_type_id=document_type_id)
        
        return queryset.order_by('-uploaded_at')

class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UploadedDocument.objects.filter(user=self.request.user)

class SummarizeDocumentView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            doc = UploadedDocument.objects.get(pk=pk, user=request.user)
            if not doc.extracted_text:
                return Response({"error": "Text not extracted from document."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if text extraction failed
            if doc.extracted_text.startswith("Text extraction failed:"):
                return Response({"error": "Cannot generate summary. " + doc.extracted_text}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for cached summary first to prevent token waste
            cache_key = f"summary_doc_{pk}"
            cached_summary = cache.get(cache_key)
            if cached_summary:
                return Response({"summary": cached_summary})
            
            # Prevent concurrent API calls for same document
            lock_key = f"summary_lock_{pk}"
            if cache.get(lock_key):
                return Response({"error": "Summary is already being generated. Please wait a moment and try again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Set lock to prevent concurrent requests - reduced from 60 to 30 seconds
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                summary = get_gemini_summary(doc.extracted_text)
                # Cache the result for 24 hours to prevent regeneration
                cache.set(cache_key, summary, timeout=86400)
                return Response({"summary": summary})
            finally:
                # Always release the lock
                cache.delete(lock_key)
                
        except UploadedDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Summary generation failed for doc {pk}: {str(e)}")
            # Check if it's a model overload error
            if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
                return Response({
                    "error": "AI summary is temporarily unavailable due to high demand.",
                    "details": "We're using a basic summary instead. Please try again in a few minutes for AI-powered summary.",
                    "fallback_mode": True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({"error": "Failed to generate summary. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateQuizView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            doc = UploadedDocument.objects.get(pk=pk, user=request.user)
            if not doc.extracted_text:
                return Response({"error": "Text not extracted from document."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if text extraction failed
            if doc.extracted_text.startswith("Text extraction failed:"):
                return Response({"error": "Cannot generate quiz. " + doc.extracted_text}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if quiz already exists for this document to prevent duplicate API calls
            existing_quiz = Quiz.objects.filter(document=doc).first()
            if existing_quiz:
                serializer = QuizSerializer(existing_quiz)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Prevent concurrent API calls for same document
            lock_key = f"quiz_lock_{pk}"
            if cache.get(lock_key):
                return Response({"error": "Quiz is already being generated. Please wait a moment and try again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Set lock to prevent concurrent requests - reduced from 60 to 30 seconds
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                quiz_data = get_gemini_quiz(doc.extracted_text)
                quiz = Quiz.objects.create(document=doc, title=f"Quiz for {doc.title}", questions=quiz_data)
                serializer = QuizSerializer(quiz)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            finally:
                # Always release the lock
                cache.delete(lock_key)
                
        except UploadedDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Quiz generation failed for doc {pk}: {str(e)}")
            # Check if it's a model overload error
            if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
                return Response({
                    "error": "AI quiz generation is temporarily unavailable due to high demand.",
                    "details": "We're using a basic quiz instead. Please try again in a few minutes for AI-powered quiz.",
                    "fallback_mode": True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({"error": "Failed to generate quiz. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateFlashcardsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            doc = UploadedDocument.objects.get(pk=pk, user=request.user)
            if not doc.extracted_text:
                return Response({"error": "Text not extracted from document."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if text extraction failed
            if doc.extracted_text.startswith("Text extraction failed:"):
                return Response({"error": "Cannot generate flashcards. " + doc.extracted_text}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if flashcards already exist for this document to prevent duplicate API calls
            existing_flashcard_set = FlashcardSet.objects.filter(document=doc).first()
            if existing_flashcard_set:
                serializer = FlashcardSetSerializer(existing_flashcard_set)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Prevent concurrent API calls for same document
            lock_key = f"flashcards_lock_{pk}"
            if cache.get(lock_key):
                return Response({"error": "Flashcards are already being generated. Please wait a moment and try again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Set lock to prevent concurrent requests - reduced from 60 to 30 seconds
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                flashcard_data = get_gemini_flashcards(doc.extracted_text)
                flashcard_set = FlashcardSet.objects.create(document=doc, title=f"Flashcards for {doc.title}")
                
                for item in flashcard_data['flashcards']:
                    Flashcard.objects.create(flashcard_set=flashcard_set, front=item['front'], back=item['back'])
                
                serializer = FlashcardSetSerializer(flashcard_set)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            finally:
                # Always release the lock
                cache.delete(lock_key)
                
        except UploadedDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Flashcards generation failed for doc {pk}: {str(e)}")
            # Check if it's a model overload error
            if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
                return Response({
                    "error": "AI flashcard generation is temporarily unavailable due to high demand.",
                    "details": "We're using basic flashcards instead. Please try again in a few minutes for AI-powered flashcards.",
                    "fallback_mode": True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({"error": "Failed to generate flashcards. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QnAView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        question = request.data.get('question')
        if not question:
            return Response({"error": "Question not provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate question length to prevent abuse
        if len(question) > 1000:
            return Response({"error": "Question is too long. Please keep it under 1000 characters."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            doc = UploadedDocument.objects.get(pk=pk, user=request.user)
            if not doc.extracted_text:
                return Response({"error": "Text not extracted from document."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if text extraction failed
            if doc.extracted_text.startswith("Text extraction failed:"):
                return Response({"error": "Cannot answer questions. " + doc.extracted_text}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create question hash for caching to prevent duplicate API calls
            question_normalized = question.strip().lower()
            question_hash = hashlib.sha256(question_normalized.encode()).hexdigest()
            
            # Check for cached answer first
            cached_qa = QuestionAnswer.objects.filter(document=doc, question_hash=question_hash).first()
            if cached_qa:
                return Response({"question": question, "answer": cached_qa.answer})
            
            # Prevent concurrent API calls for same question
            lock_key = f"qa_lock_{pk}_{question_hash[:16]}"
            if cache.get(lock_key):
                return Response({"error": "This question is already being processed. Please wait a moment and try again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Set lock to prevent concurrent requests - reduced from 60 to 30 seconds
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                answer = get_gemini_answer(doc.extracted_text, question)
                
                # Cache the Q&A in database for future use
                QuestionAnswer.objects.create(
                    document=doc,
                    question_hash=question_hash,
                    question=question,
                    answer=answer
                )
                
                return Response({"question": question, "answer": answer})
            finally:
                # Always release the lock
                cache.delete(lock_key)
                
        except UploadedDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Q&A failed for doc {pk}: {str(e)}")
            # Check if it's a model overload error
            if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
                return Response({
                    "error": "AI Q&A is temporarily unavailable due to high demand.",
                    "details": "We're using basic keyword matching instead. Please try again in a few minutes for AI-powered answers.",
                    "fallback_mode": True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({"error": "Failed to process question. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SmartSearchView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        search_query = request.data.get('query', '').strip()
        
        if not search_query:
            return Response({"error": "Search query is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(search_query) < 3:
            return Response({"error": "Search query must be at least 3 characters long."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate query length to prevent abuse
        if len(search_query) > 500:
            return Response({"error": "Search query is too long. Please keep it under 500 characters."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create query hash for caching
            query_normalized = search_query.lower()
            query_hash = hashlib.sha256(query_normalized.encode()).hexdigest()
            
            # Check for cached search results first
            cached_search = SearchCache.objects.filter(user=request.user, query_hash=query_hash).first()
            if cached_search and cached_search.is_fresh(max_age_hours=1):
                search_results = cached_search.results
                search_results['query'] = search_query  # Update with original casing
                return Response(search_results, status=status.HTTP_200_OK)
            
            # Get all user documents with extracted text
            user_documents = UploadedDocument.objects.filter(
                user=request.user,
                extracted_text__isnull=False
            ).exclude(extracted_text='').exclude(extracted_text__startswith="Text extraction failed:")
            
            if not user_documents.exists():
                return Response({
                    "results": [],
                    "total_found": 0,
                    "search_summary": "No documents found to search through.",
                    "query": search_query
                })
            
            # Prevent concurrent API calls for same search query
            lock_key = f"search_lock_{request.user.id}_{query_hash[:16]}"
            if cache.get(lock_key):
                return Response({"error": "This search is already being processed. Please wait a moment and try again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Set lock to prevent concurrent requests - reduced from 60 to 30 seconds
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                # Prepare document data for AI search - OPTIMIZE CONTEXT LENGTH
                documents_data = []
                for doc in user_documents[:10]:  # Limit to first 10 documents to manage context
                    # Optimize text length to prevent token waste - use first 1000 chars instead of 2000
                    truncated_content = doc.extracted_text[:1000] if len(doc.extracted_text) > 1000 else doc.extracted_text
                    documents_data.append((doc.id, doc.title, truncated_content))
                
                # Perform smart search using AI
                search_results = smart_search_documents(documents_data, search_query)
                
                # Add document URLs to results
                for result in search_results.get('results', []):
                    try:
                        doc_id = int(result['document_id'])
                        result['document_url'] = f"/documents/{doc_id}/"
                    except (ValueError, KeyError):
                        result['document_url'] = None
                
                # Add the original query to the response
                search_results['query'] = search_query
                
                # Cache the search results for future use
                SearchCache.objects.update_or_create(
                    user=request.user,
                    query_hash=query_hash,
                    defaults={
                        'query': search_query,
                        'results': search_results
                    }
                )
                
                return Response(search_results, status=status.HTTP_200_OK)
            finally:
                # Always release the lock
                cache.delete(lock_key)
            
        except Exception as e:
            logging.error(f"Smart search failed for user {request.user.id}: {str(e)}")
            
            # Check if it's a model overload error
            if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
                return Response({
                    "error": "AI search is temporarily unavailable due to high demand.",
                    "details": "We're using basic text search instead. Please try again in a few minutes for AI-powered search.",
                    "fallback_mode": True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({
                    "error": "Search failed. Please try again later.",
                    "details": "An unexpected error occurred during search."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SearchSuggestionsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        partial_query = request.data.get('query', '').strip()
        
        if not partial_query or len(partial_query) < 2:
            return Response({"suggestions": []})
            
        # Validate query length to prevent abuse
        if len(partial_query) > 100:
            return Response({"suggestions": []})
        
        try:
            # Create cache key for suggestions
            suggestions_cache_key = f"suggestions_{request.user.id}_{hashlib.sha256(partial_query.lower().encode()).hexdigest()[:16]}"
            cached_suggestions = cache.get(suggestions_cache_key)
            if cached_suggestions:
                return Response({"suggestions": cached_suggestions})
            
            # Get all user documents with extracted text
            user_documents = UploadedDocument.objects.filter(
                user=request.user,
                extracted_text__isnull=False
            ).exclude(extracted_text='').exclude(extracted_text__startswith="Text extraction failed:")
            
            if not user_documents.exists():
                return Response({"suggestions": []})
            
            # Prevent concurrent API calls for same user
            lock_key = f"suggestions_lock_{request.user.id}"
            if cache.get(lock_key):
                return Response({"suggestions": []})  # Return empty if already processing
            
            # Set lock to prevent concurrent requests
            cache.set(lock_key, True, timeout=30)  # 30 second lock
            
            try:
                # Prepare document data for generating suggestions - OPTIMIZE CONTEXT
                documents_data = []
                for doc in user_documents[:5]:  # Limit to first 5 documents for suggestions
                    # Use only title and first 300 chars for suggestions to save tokens
                    truncated_content = doc.extracted_text[:300] if len(doc.extracted_text) > 300 else doc.extracted_text
                    documents_data.append((doc.id, doc.title, truncated_content))
                
                # Generate suggestions using AI
                suggestions = generate_search_suggestions(documents_data, partial_query)
                
                # Cache suggestions for 10 minutes
                cache.set(suggestions_cache_key, suggestions, timeout=600)
                
                return Response({"suggestions": suggestions})
            finally:
                # Always release the lock
                cache.delete(lock_key)
            
        except Exception as e:
            logging.error(f"Search suggestions failed for user {request.user.id}: {str(e)}")
            return Response({"suggestions": []})

class RetryTextExtractionView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            doc = UploadedDocument.objects.get(pk=pk, user=request.user)
            
            # Check if document actually needs retry
            if doc.extracted_text and not doc.extracted_text.startswith("Text extraction failed:"):
                return Response({
                    "message": "Text extraction already successful",
                    "extracted_text_length": len(doc.extracted_text)
                }, status=status.HTTP_200_OK)
            
            print(f"Retrying text extraction for document: {doc.title}")
            
            # Attempt text extraction again
            try:
                extracted_text = extract_text_from_file(doc.file.path)
                doc.extracted_text = extracted_text
                doc.save()
                
                return Response({
                    "message": "Text extraction successful! AI features are now available.",
                    "extracted_text_length": len(extracted_text),
                    "success": True
                }, status=status.HTTP_200_OK)
                
            except Exception as extraction_error:
                # Save the new error message
                error_message = f"Text extraction failed: {str(extraction_error)}"
                doc.extracted_text = error_message
                doc.save()
                
                return Response({
                    "message": "Text extraction failed again. The file might be corrupted or unsupported.",
                    "error": str(extraction_error),
                    "success": False
                }, status=status.HTTP_200_OK)  # Still 200 because the endpoint worked
                
        except UploadedDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)