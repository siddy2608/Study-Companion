import React, { useState, useRef } from 'react';
import { uploadDocument } from '../services/api';
import DocumentTypeSelector from './DocumentTypeSelector';

function DocumentUpload({ onUploadSuccess }) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success', 'error', or 'warning'
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title.trim()) return;

        setIsLoading(true);
        setMessage('');
        setMessageType('');

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('file', file);
        
        // Always send document_type_id - null for auto-detect, specific ID for manual selection
        if (selectedDocumentTypeId !== null) {
            formData.append('document_type_id', selectedDocumentTypeId);
        }
        // Note: If selectedDocumentTypeId is null (auto-detect), we don't send the field
        // This tells the backend to auto-assign based on file extension

        try {
            const response = await uploadDocument(formData);
            console.log('=== UPLOAD SUCCESS ===');
            console.log('Upload response:', response);
            console.log('Response data:', response.data);
            console.log('Document type assigned:', response.data.document_type);
            
            setTitle('');
            setFile(null);
            setSelectedDocumentTypeId(null);
            
            // Check if upload succeeded but with text extraction issues
            if (response.data && response.data.extracted_text && 
                response.data.extracted_text.startsWith("Text extraction failed:")) {
                setMessage('⚠️ Document uploaded successfully, but text extraction failed. You can still view the file, but AI features may not work until the issue is resolved.');
                setMessageType('warning');
            } else {
                setMessage('Document uploaded successfully! 🎉');
                setMessageType('success');
            }
            
            console.log('Calling onUploadSuccess callback to refresh document list...');
            // Small delay to ensure server has fully processed the upload
            setTimeout(() => {
                onUploadSuccess();
                console.log('onUploadSuccess callback completed');
            }, 500);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('=== UPLOAD FAILED ===');
            console.error('Upload failed:', error);
            console.error('Error response:', error.response?.data);
            setMessage('Upload failed. Please check your file and try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            // Auto-generate title from filename if title is empty
            if (!title.trim()) {
                const fileName = selectedFile.name;
                const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
                setTitle(nameWithoutExtension);
            }
            setMessage('');
            setMessageType('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileChange(droppedFile);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const getFileIcon = (file) => {
        if (!file) return '📁';
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'txt': return '📃';
            case 'ppt':
            case 'pptx': return '📊';
            default: return '📋';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <form onSubmit={handleUpload} className="upload-form">
            {/* File Upload Area */}
            <div 
                className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
                style={{
                    border: `2px dashed ${isDragOver ? 'var(--primary-500)' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: isDragOver ? 'var(--primary-50)' : 'white',
                    marginBottom: 'var(--space-4)'
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                />
                
                {file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ fontSize: '2.5rem' }}>{getFileIcon(file)}</div>
                        <div style={{ fontWeight: '600', color: 'var(--gray-700)' }}>
                            {file.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            {formatFileSize(file.size)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                            Click to change file
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ fontSize: '2.5rem', opacity: 0.6 }}>📎</div>
                        <div style={{ fontWeight: '600', color: 'var(--gray-700)' }}>
                            {isDragOver ? 'Drop your file here' : 'Click to browse or drag and drop'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            Supports PDF, DOC, DOCX, TXT, PPT, PPTX
                        </div>
                    </div>
                )}
            </div>

            {/* Title Input */}
            <input
                type="text"
                placeholder="Document title (auto-filled from filename)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-input"
                style={{ marginBottom: 'var(--space-4)' }}
            />

            {/* Document Type Selector */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                }}>
                    Document Type:
                </label>
                <DocumentTypeSelector
                    selectedTypeId={selectedDocumentTypeId}
                    onTypeChange={setSelectedDocumentTypeId}
                    showAutoDetect={true}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || !file || !title.trim()}
                className="btn btn-primary"
                style={{
                    width: '100%',
                    opacity: (isLoading || !file || !title.trim()) ? 0.6 : 1,
                    cursor: (isLoading || !file || !title.trim()) ? 'not-allowed' : 'pointer'
                }}
            >
                {isLoading ? 'Uploading...' : 'Upload Document'}
            </button>

            {/* Message Display */}
            {message && (
                <div style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    backgroundColor: messageType === 'success' ? 'var(--green-50)' : 
                                   messageType === 'error' ? 'var(--red-50)' : 'var(--yellow-50)',
                    color: messageType === 'success' ? 'var(--green-700)' : 
                          messageType === 'error' ? 'var(--red-700)' : 'var(--yellow-700)',
                    border: `1px solid ${messageType === 'success' ? 'var(--green-200)' : 
                                       messageType === 'error' ? 'var(--red-200)' : 'var(--yellow-200)'}`
                }}>
                    {message}
                </div>
            )}
        </form>
    );
}

export default DocumentUpload;