#!/usr/bin/env python3
"""
Test script to check Document Types feature
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

def test_document_types():
    """Test if document types are working"""
    
    print("🔍 Testing Document Types Feature...")
    print("=" * 50)
    
    # Check if DocumentType model exists
    try:
        doc_types = DocumentType.objects.all()
        print(f"✅ Found {doc_types.count()} document types in database")
        
        if doc_types.count() == 0:
            print("⚠️  No document types found. You need to run:")
            print("   python manage.py setup_document_types")
            return False
        
        # Show existing document types
        print("\n📋 Existing Document Types:")
        for dt in doc_types:
            print(f"   {dt.icon} {dt.name} ({dt.color})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing DocumentType model: {e}")
        print("   You may need to run migrations:")
        print("   python manage.py migrate")
        return False

def test_uploaded_documents():
    """Test if uploaded documents have document types"""
    
    print("\n📄 Testing Uploaded Documents...")
    print("=" * 50)
    
    try:
        documents = UploadedDocument.objects.all()
        print(f"✅ Found {documents.count()} documents in database")
        
        if documents.count() == 0:
            print("ℹ️  No documents found. Upload some documents to test.")
            return True
        
        # Check document types
        with_types = documents.filter(document_type__isnull=False).count()
        without_types = documents.filter(document_type__isnull=True).count()
        
        print(f"   📊 Documents with types: {with_types}")
        print(f"   📊 Documents without types: {without_types}")
        
        # Show some examples
        print("\n📋 Sample Documents:")
        for doc in documents[:5]:
            doc_type = doc.document_type.name if doc.document_type else "No type"
            print(f"   📄 {doc.title} → {doc_type}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing UploadedDocument model: {e}")
        return False

def setup_document_types():
    """Set up default document types"""
    
    print("\n🔧 Setting up default document types...")
    print("=" * 50)
    
    try:
        from django.core.management import call_command
        call_command('setup_document_types')
        print("✅ Default document types created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error setting up document types: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Document Types Feature Test")
    print("=" * 50)
    
    # Test 1: Check if document types exist
    types_ok = test_document_types()
    
    # Test 2: Check uploaded documents
    docs_ok = test_uploaded_documents()
    
    # If no document types, offer to set them up
    if not types_ok:
        print("\n" + "=" * 50)
        response = input("Would you like to set up default document types? (y/n): ")
        if response.lower() == 'y':
            setup_document_types()
            print("\n🔄 Re-testing after setup...")
            test_document_types()
    
    print("\n" + "=" * 50)
    if types_ok and docs_ok:
        print("🎉 Document Types feature is working correctly!")
        print("\n💡 Next steps:")
        print("   1. Start your Django server: python manage.py runserver")
        print("   2. Start your React app: npm start")
        print("   3. Upload a document and test the feature")
    else:
        print("⚠️  Some issues found. Please check the errors above.") 