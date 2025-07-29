from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import pre_delete
from django.dispatch import receiver
import os

class DocumentType(models.Model):
    """Model for categorizing documents by type"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='📄')  # Emoji or icon class
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color code
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class UploadedDocument(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    document_type = models.ForeignKey(DocumentType, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    extracted_text = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    def get_file_extension(self):
        """Get the file extension for determining default document type"""
        if self.file:
            return self.file.name.split('.')[-1].lower()
        return None
    
    def auto_assign_document_type(self):
        """Automatically assign document type based on file extension"""
        print(f"🔍 auto_assign_document_type() called for document: {self.title}")
        
        if not self.document_type:
            extension = self.get_file_extension()
            print(f"📁 File extension detected: {extension}")
            
            if extension:
                # Map file extensions to document types
                extension_to_type = {
                    'pdf': 'PDF Document',
                    'doc': 'Word Document',
                    'docx': 'Word Document',
                    'txt': 'Text Document',
                    'ppt': 'PowerPoint Presentation',
                    'pptx': 'PowerPoint Presentation',
                    'xls': 'Excel Spreadsheet',
                    'xlsx': 'Excel Spreadsheet',
                }
                
                type_name = extension_to_type.get(extension, 'Other Document')
                print(f"🎯 Mapping extension '{extension}' to type: '{type_name}'")
                
                try:
                    doc_type = DocumentType.objects.get(name=type_name)
                    print(f"✅ Found existing document type: {doc_type.name}")
                    self.document_type = doc_type
                    self.save(update_fields=['document_type'])
                    print(f"💾 Saved document type assignment")
                except DocumentType.DoesNotExist:
                    print(f"⚠️ Document type '{type_name}' not found, creating new one...")
                    # Create the document type if it doesn't exist
                    doc_type = DocumentType.objects.create(
                        name=type_name,
                        description=f"Auto-generated type for {extension.upper()} files"
                    )
                    print(f"✅ Created new document type: {doc_type.name}")
                    self.document_type = doc_type
                    self.save(update_fields=['document_type'])
                    print(f"💾 Saved document type assignment")
            else:
                print("⚠️ No file extension detected")
        else:
            print(f"ℹ️ Document already has type: {self.document_type.name}")

# Signal to delete the file when the model instance is deleted
@receiver(pre_delete, sender=UploadedDocument)
def delete_uploaded_document_file(sender, instance, **kwargs):
    """
    Delete the physical file from media folder when UploadedDocument is deleted.
    This prevents orphaned files from accumulating in the media directory.
    """
    if instance.file:
        # Check if the file exists before trying to delete it
        if os.path.isfile(instance.file.path):
            try:
                os.remove(instance.file.path)
                print(f"✅ Successfully deleted file: {instance.file.path}")
            except OSError as e:
                print(f"⚠️  Warning: Could not delete file {instance.file.path}: {e}")
        else:
            print(f"ℹ️  File not found (may have been already deleted): {instance.file.path}")

class Quiz(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    questions = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz for {self.document.title}"

class FlashcardSet(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name='flashcard_sets')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flashcards for {self.document.title}"

class Flashcard(models.Model):
    flashcard_set = models.ForeignKey(FlashcardSet, on_delete=models.CASCADE, related_name='flashcards')
    front = models.TextField()
    back = models.TextField()

    def __str__(self):
        return f"Flashcard: {self.front[:50]}"

class TemporaryUser(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_otp_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)



# Cache for Q&A to avoid repeat questions
class QuestionAnswer(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name='qa_cache')
    question_hash = models.CharField(max_length=64, db_index=True)  # Hash of the question
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('document', 'question_hash')
    
    def __str__(self):
        return f"Q&A for {self.document.title}: {self.question[:50]}"

# Cache for search results
class SearchCache(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    query_hash = models.CharField(max_length=64, db_index=True)
    query = models.TextField()
    results = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'query_hash')
    
    def is_fresh(self, max_age_hours=1):
        """Check if cached search is still fresh"""
        return timezone.now() - self.created_at < timedelta(hours=max_age_hours)
    
    def __str__(self):
        return f"Search cache for {self.user.username}: {self.query[:50]}"