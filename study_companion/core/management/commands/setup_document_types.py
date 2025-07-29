from django.core.management.base import BaseCommand
from core.models import DocumentType

class Command(BaseCommand):
    help = 'Set up default document types for the Study Companion application'

    def handle(self, *args, **options):
        default_types = [
            {
                'name': 'PDF Document',
                'description': 'Portable Document Format files',
                'icon': '📄',
                'color': '#DC2626'
            },
            {
                'name': 'Word Document',
                'description': 'Microsoft Word documents (.doc, .docx)',
                'icon': '📝',
                'color': '#2563EB'
            },
            {
                'name': 'Text Document',
                'description': 'Plain text files (.txt)',
                'icon': '📃',
                'color': '#059669'
            },
            {
                'name': 'PowerPoint Presentation',
                'description': 'Microsoft PowerPoint presentations (.ppt, .pptx)',
                'icon': '📊',
                'color': '#DC2626'
            },
            {
                'name': 'Excel Spreadsheet',
                'description': 'Microsoft Excel spreadsheets (.xls, .xlsx)',
                'icon': '📈',
                'color': '#059669'
            },
            {
                'name': 'Research Paper',
                'description': 'Academic research papers and publications',
                'icon': '🔬',
                'color': '#7C3AED'
            },
            {
                'name': 'Lecture Notes',
                'description': 'Class notes and lecture materials',
                'icon': '📚',
                'color': '#F59E0B'
            },
            {
                'name': 'Study Guide',
                'description': 'Study guides and exam preparation materials',
                'icon': '📖',
                'color': '#10B981'
            },
            {
                'name': 'Other Document',
                'description': 'Other document types',
                'icon': '📋',
                'color': '#6B7280'
            }
        ]

        created_count = 0
        for doc_type_data in default_types:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_type_data['name'],
                defaults=doc_type_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created document type: {doc_type.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Document type already exists: {doc_type.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Successfully set up {created_count} new document types!')
        ) 