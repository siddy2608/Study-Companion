from django.urls import path
from .views import (
    DocumentUploadView,
    DocumentListView,
    DocumentDetailView,
    SummarizeDocumentView,
    GenerateQuizView,
    GenerateFlashcardsView,
    QnAView,
    SmartSearchView,
    SearchSuggestionsView,
    RetryTextExtractionView,
    DocumentTypeListView,
    DocumentTypeCreateView,
    DocumentTypeDetailView,
)

urlpatterns = [
    # Document Type URLs
    path('document-types/', DocumentTypeListView.as_view(), name='document-type-list'),
    path('document-types/create/', DocumentTypeCreateView.as_view(), name='document-type-create'),
    path('document-types/<int:pk>/', DocumentTypeDetailView.as_view(), name='document-type-detail'),
    
    # Document URLs
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/search/', SmartSearchView.as_view(), name='smart-search'),
    path('documents/search/suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/<int:pk>/summarize/', SummarizeDocumentView.as_view(), name='document-summarize'),
    path('documents/<int:pk>/generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz'),
    path('documents/<int:pk>/generate-flashcards/', GenerateFlashcardsView.as_view(), name='generate-flashcards'),
    path('documents/<int:pk>/qna/', QnAView.as_view(), name='document-qna'),
    path('documents/<int:pk>/retry-extraction/', RetryTextExtractionView.as_view(), name='retry-text-extraction'),
]