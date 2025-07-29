# Document Types API Documentation

## Overview
The Document Types feature allows users to categorize their documents for better organization. Documents can be automatically categorized based on file extension or manually assigned to specific types.

## Models

### DocumentType
- `id`: Primary key
- `name`: Type name (e.g., "PDF Document", "Word Document")
- `description`: Type description
- `icon`: Emoji icon (e.g., "📄", "📝")
- `color`: Hex color code (e.g., "#DC2626")
- `created_at`: Creation timestamp

### UploadedDocument (Updated)
- `document_type`: Foreign key to DocumentType (optional)
- Auto-assigns document type based on file extension if not provided

## API Endpoints

### 1. List Document Types
```
GET /api/document-types/
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "PDF Document",
    "description": "Portable Document Format files",
    "icon": "📄",
    "color": "#DC2626",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### 2. Create Document Type
```
POST /api/document-types/create/
```
**Request Body:**
```json
{
  "name": "Custom Type",
  "description": "Custom document type",
  "icon": "📋",
  "color": "#3B82F6"
}
```

### 3. Update Document Type
```
PUT /api/document-types/{id}/
```
**Request Body:** Same as create

### 4. Delete Document Type
```
DELETE /api/document-types/{id}/
```

### 5. List Documents (with filtering)
```
GET /api/documents/?document_type={id}
```
**Query Parameters:**
- `document_type`: Filter by document type ID

### 6. Upload Document (Updated)
```
POST /api/documents/upload/
```
**Request Body:**
```json
{
  "title": "Document Title",
  "file": "file_data",
  "document_type_id": 1  // Optional
}
```

## Auto-Assignment Rules

Documents are automatically assigned document types based on file extension:

| Extension | Document Type |
|-----------|---------------|
| .pdf | PDF Document |
| .doc, .docx | Word Document |
| .txt | Text Document |
| .ppt, .pptx | PowerPoint Presentation |
| .xls, .xlsx | Excel Spreadsheet |
| Other | Other Document |

## Default Document Types

The system comes with these pre-configured document types:

1. **PDF Document** 📄 - Red (#DC2626)
2. **Word Document** 📝 - Blue (#2563EB)
3. **Text Document** 📃 - Green (#059669)
4. **PowerPoint Presentation** 📊 - Red (#DC2626)
5. **Excel Spreadsheet** 📈 - Green (#059669)
6. **Research Paper** 🔬 - Purple (#7C3AED)
7. **Lecture Notes** 📚 - Yellow (#F59E0B)
8. **Study Guide** 📖 - Green (#10B981)
9. **Other Document** 📋 - Gray (#6B7280)

## Setup Commands

### Initialize Default Document Types
```bash
python manage.py setup_document_types
```

### Create and Apply Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Frontend Integration

### Document Type Selector Component
```javascript
// Example React component for document type selection
const DocumentTypeSelector = ({ selectedType, onTypeChange }) => {
  const [types, setTypes] = useState([]);
  
  useEffect(() => {
    fetch('/api/document-types/')
      .then(res => res.json())
      .then(data => setTypes(data));
  }, []);
  
  return (
    <select value={selectedType} onChange={(e) => onTypeChange(e.target.value)}>
      <option value="">Auto-detect</option>
      {types.map(type => (
        <option key={type.id} value={type.id}>
          {type.icon} {type.name}
        </option>
      ))}
    </select>
  );
};
```

### Document List with Type Filtering
```javascript
// Example for filtering documents by type
const fetchDocuments = (documentTypeId = null) => {
  const url = documentTypeId 
    ? `/api/documents/?document_type=${documentTypeId}`
    : '/api/documents/';
    
  fetch(url)
    .then(res => res.json())
    .then(data => setDocuments(data));
};
```

## Benefits

1. **Better Organization**: Users can categorize documents by type
2. **Visual Distinction**: Each type has its own icon and color
3. **Filtering**: Easy to filter documents by type
4. **Auto-Detection**: Automatic categorization based on file extension
5. **Customization**: Users can create custom document types
6. **Search Enhancement**: Better search results with type context 