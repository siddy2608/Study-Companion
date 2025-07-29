from django.contrib import admin
from .models import UploadedDocument, Quiz, FlashcardSet, Flashcard, DocumentType

@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'document_type', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at', 'user']
    search_fields = ['title', 'user__username']
    ordering = ['-uploaded_at']

admin.site.register(Quiz)
admin.site.register(FlashcardSet)
admin.site.register(Flashcard)