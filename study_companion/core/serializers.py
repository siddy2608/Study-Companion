from rest_framework import serializers
from .models import UploadedDocument, Quiz, FlashcardSet, Flashcard, DocumentType

class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'description', 'icon', 'color', 'created_at']

class UploadedDocumentSerializer(serializers.ModelSerializer):
    document_type = DocumentTypeSerializer(read_only=True)
    document_type_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = UploadedDocument
        fields = ['id', 'user', 'title', 'file', 'document_type', 'document_type_id', 'extracted_text', 'uploaded_at']
        read_only_fields = ['user', 'extracted_text', 'uploaded_at']
    
    def create(self, validated_data):
        document_type_id = validated_data.pop('document_type_id', None)
        print(f"🔍 UploadedDocumentSerializer.create() - document_type_id: {document_type_id}")
        
        instance = super().create(validated_data)
        print(f"📄 Created document instance: {instance.title}")
        
        # Auto-assign document type if not provided
        if document_type_id:
            print(f"🎯 Manual document type selected: {document_type_id}")
            try:
                instance.document_type = DocumentType.objects.get(id=document_type_id)
                instance.save(update_fields=['document_type'])
                print(f"✅ Manually assigned document type: {instance.document_type.name}")
            except DocumentType.DoesNotExist:
                print(f"❌ Document type with ID {document_type_id} not found")
                pass
        else:
            print("🤖 Auto-detecting document type based on file extension...")
            # Auto-assign based on file extension
            instance.auto_assign_document_type()
            if instance.document_type:
                print(f"✅ Auto-assigned document type: {instance.document_type.name}")
            else:
                print("⚠️ No document type was auto-assigned")
        
        return instance

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'document', 'title', 'questions', 'created_at']

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'front', 'back']

class FlashcardSetSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)
    class Meta:
        model = FlashcardSet
        fields = ['id', 'document', 'title', 'created_at', 'flashcards']