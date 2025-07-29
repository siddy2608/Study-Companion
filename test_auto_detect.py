#!/usr/bin/env python3
"""
Test script to verify auto-detect functionality
"""

import os
import sys
import django
from pathlib import Path

# Add the Django project to the Python path
sys.path.append(str(Path(__file__).parent / 'study_companion'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'study_companion.settings')
django.setup()

from core.models import DocumentType, UploadedDocument
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

def test_auto_detect():
    """Test auto-detect functionality"""
    
    print("🔍 Testing Auto-Detect Functionality...")
    print("=" * 50)
    
    # Check if document types exist
    doc_types = DocumentType.objects.all()
    if doc_types.count() == 0:
        print("❌ No document types found. Run setup_document_types first.")
        return False
    
    print(f"✅ Found {doc_types.count()} document types:")
    for dt in doc_types:
        print(f"   {dt.icon} {dt.name} (ID: {dt.id})")
    
    # Create a test user
    test_user, created = User.objects.get_or_create(
        username='test_auto_detect',
        defaults={'email': 'test@example.com'}
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created test user: {test_user.username}")
    else:
        print(f"✅ Using existing test user: {test_user.username}")
    
    # Test different file types
    test_files = [
        ("test_document.pdf", b"PDF content", "application/pdf"),
        ("test_document.docx", b"Word content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("test_document.txt", b"Text content", "text/plain"),
        ("test_document.ppt", b"PowerPoint content", "application/vnd.ms-powerpoint"),
    ]
    
    for filename, content, content_type in test_files:
        print(f"\n📄 Testing file: {filename}")
        print("-" * 30)
        
        # Create test file
        test_file = SimpleUploadedFile(filename, content, content_type=content_type)
        
        # Create document with auto-detect
        document = UploadedDocument.objects.create(
            user=test_user,
            title=f"Test {filename}",
            file=test_file
        )
        
        print(f"📝 Created document: {document.title}")
        
        # Test auto-assignment
        document.auto_assign_document_type()
        
        if document.document_type:
            print(f"✅ Auto-assigned type: {document.document_type.icon} {document.document_type.name}")
        else:
            print("❌ No type was assigned")
        
        # Clean up
        document.delete()
    
    # Clean up test user
    test_user.delete()
    
    print("\n" + "=" * 50)
    print("🎉 Auto-detect test completed!")
    return True

if __name__ == "__main__":
    test_auto_detect() 