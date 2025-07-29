import os
import json
from google import genai
from google.genai import types
import PyPDF2
from PIL import Image
import pytesseract
from docx import Document

from django.conf import settings

# Initialize client only if API key is available
client = None
if settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY != 'your_api_key_here':
    try:
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        print("✅ Gemini client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Gemini client: {e}")
        client = None
else:
    print("⚠️  GOOGLE_API_KEY not found or not configured. AI features will use fallback methods.")
    print("📝 To enable AI features, add your API key to the .env file")
    print("🔗 Get your API key from: https://makersuite.google.com/app/apikey")

def clean_response_text(text):
    """
    Clean response text to remove asterisks and ensure proper formatting
    """
    if not text:
        return text
    
    # Remove all asterisks from the response
    cleaned_text = text.replace('*', '')
    
    # Clean up any double spaces that might result from asterisk removal
    cleaned_text = ' '.join(cleaned_text.split())
    
    return cleaned_text

# Optimized generation config to reduce token usage
generation_config = types.GenerateContentConfig(
    temperature=0.3,  # Reduced for more focused responses
    top_p=0.8,        # Reduced for more consistent outputs
    top_k=40,         # Increased for better quality
    max_output_tokens=1024,  # Reduced from 2048 to save tokens
    safety_settings=[
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
    ]
)

# Separate config for brief responses (summaries, short answers)
brief_generation_config = types.GenerateContentConfig(
    temperature=0.2,
    top_p=0.8,
    top_k=40,
    max_output_tokens=512,  # Even shorter for summaries
    safety_settings=[
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        ),
    ]
)



def extract_text_from_file(file_path):
    _, file_extension = os.path.splitext(file_path)
    text = ""
    
    try:
        if file_extension.lower() == '.pdf':
            # Primary method: PyPDF2 (unchanged)
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # Fallback method: OCR for scanned PDFs (only if PyPDF2 failed)
            if not text.strip():
                try:
                    # Try OCR extraction for scanned PDFs
                    print(f"PyPDF2 found no text in PDF, attempting OCR extraction...")
                    
                    try:
                        from pdf2image import convert_from_path
                        print("pdf2image imported successfully")
                    except ImportError as import_err:
                        print(f"pdf2image import failed: {import_err}")
                        raise Exception("OCR extraction requires pdf2image. Install with: pip install pdf2image")
                    
                    # Convert PDF pages to images
                    print("Converting PDF pages to images...")
                    try:
                        pages = convert_from_path(file_path, dpi=200)
                        print(f"Successfully converted PDF to {len(pages)} page images")
                    except Exception as convert_error:
                        if "poppler" in str(convert_error).lower():
                            raise Exception("OCR extraction requires Poppler. Install Poppler for your system:\n- Windows: Download from http://blog.alivate.com.au/poppler-windows/\n- macOS: brew install poppler\n- Linux: sudo apt-get install poppler-utils")
                        else:
                            raise Exception(f"PDF conversion failed: {str(convert_error)}")
                    
                    ocr_text = ""
                    
                    for i, page in enumerate(pages):
                        try:
                            print(f"Processing page {i+1} with OCR...")
                            page_text = pytesseract.image_to_string(page)
                            if page_text.strip():
                                ocr_text += f"\n--- Page {i+1} ---\n{page_text}\n"
                                print(f"Page {i+1}: Extracted {len(page_text)} characters")
                            else:
                                print(f"Page {i+1}: No text found")
                        except Exception as page_error:
                            print(f"OCR failed for page {i+1}: {page_error}")
                            continue
                    
                    if ocr_text.strip():
                        text = ocr_text
                        print(f"OCR extraction successful! Total extracted: {len(text)} characters.")
                    else:
                        print("OCR extraction found no text in any pages.")
                        
                except Exception as ocr_error:
                    print(f"OCR fallback failed: {ocr_error}")
                    # Provide helpful error message with installation instructions
                    error_msg = str(ocr_error)
                    if "poppler" in error_msg.lower():
                        raise Exception(f"OCR extraction failed: {error_msg}\n\nTo enable OCR for scanned PDFs:\n1. Install Poppler: http://blog.alivate.com.au/poppler-windows/\n2. Install pdf2image: pip install pdf2image\n3. Restart the application\n\nFor now, please upload text-based PDFs only.")
                    else:
                        raise Exception(f"OCR extraction failed: {error_msg}\n\nPlease upload text-based PDFs or install required dependencies.")
        
        elif file_extension.lower() in ['.docx', '.doc']:
            # Handle Word documents (unchanged)
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
        
        elif file_extension.lower() in ['.jpg', '.jpeg', '.png']:
            text = pytesseract.image_to_string(Image.open(file_path))
        
        elif file_extension.lower() == '.txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    except Exception as e:
        raise Exception(f"Error extracting text from {file_extension} file: {str(e)}")
    
    # Clean up the text
    text = text.strip()
    if not text:
        raise Exception("No text could be extracted from the file. The file might be empty, corrupted, or a scanned document without OCR support.")
    
    return text

def get_gemini_summary(text_content):
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback summary")
        return fallback_summary(text_content)
    
    # Optimize input text length to reduce token usage
    max_input_length = 8000  # Reduced from unlimited
    if len(text_content) > max_input_length:
        text_content = text_content[:max_input_length] + "..."
    
    prompt = f"""Provide a brief, clear summary (max 200 words) of the following text. 

IMPORTANT: Do not use asterisks (*) or bullet points with asterisks in your response. Use numbered lists (1. 2. 3.) or dashes (-) instead.

Text to summarize:
{text_content}"""
    
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=brief_generation_config  # Use brief config for summaries
        )
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini AI")
        
        # Clean the response to remove any asterisks
        return clean_response_text(response.text)
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, returning fallback summary")
            return fallback_summary(text_content)
        else:
            raise Exception(f"Failed to generate summary: {e}")

def get_gemini_quiz(text_content):
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback quiz")
        return fallback_quiz(text_content)
    
    # Optimize input text length to reduce token usage
    max_input_length = 6000  # Reduced for quiz generation
    if len(text_content) > max_input_length:
        text_content = text_content[:max_input_length] + "..."
    
    prompt = f"""
    Generate a 5-question multiple-choice quiz from this text. Use this exact JSON format:
    {{
      "questions": [
        {{
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        }}
      ]
    }}

    IMPORTANT: Do not use asterisks (*) anywhere in the quiz questions or options. Use plain text formatting only.

    Text:
    {text_content}
    """
    response_text = ""
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=generation_config
        )
        response_text = (response.text or "").strip()
        
        # Clean the response text more thoroughly
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        # Remove asterisks from the response before parsing
        response_text = clean_response_text(response_text)
        
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"JSON decode error in quiz: {e}")
        print(f"Response text: {response_text}")
        return fallback_quiz(text_content)
    except Exception as e:
        print(f"Error generating quiz: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, returning fallback quiz")
            return fallback_quiz(text_content)
        else:
            return fallback_quiz(text_content)

def get_gemini_flashcards(text_content):
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback flashcards")
        return fallback_flashcards(text_content)
    
    # Optimize input text length to reduce token usage
    max_input_length = 6000  # Reduced for flashcard generation
    if len(text_content) > max_input_length:
        text_content = text_content[:max_input_length] + "..."
    
    prompt = f"""
    Create 5 flashcards from this text. Use this exact JSON format:
    {{
      "flashcards": [
        {{ "front": "Term or Question", "back": "Definition or Answer" }}
      ]
    }}

    IMPORTANT: Do not use asterisks (*) anywhere in the flashcard content. Use plain text formatting only.

    Text:
    {text_content}
    """
    response_text = ""
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=generation_config
        )
        response_text = (response.text or "").strip()
        
        # Clean the response text more thoroughly
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        # Remove asterisks from the response before parsing
        response_text = clean_response_text(response_text)
        
        parsed_data = json.loads(response_text)
        
        # Ensure the response has the expected structure
        if 'flashcards' not in parsed_data:
            raise Exception("Response doesn't contain 'flashcards' key")
        
        return parsed_data
    except json.JSONDecodeError as e:
        print(f"JSON decode error in flashcards: {e}")
        print(f"Response text: {response_text}")
        return fallback_flashcards(text_content)
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, returning fallback flashcards")
            return fallback_flashcards(text_content)
        else:
            return fallback_flashcards(text_content)

def get_gemini_answer(context, question):
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback answer")
        return fallback_answer(context, question)
    
    prompt = f"""Based on the following context, please answer the question.

IMPORTANT: Do not use asterisks (*) in your response. Use numbered lists (1. 2. 3.) or dashes (-) for formatting instead.

Context: {context}

Question: {question}"""
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=generation_config
        )
        if not response or not response.text:
            raise Exception("Empty response from Gemini API")
        
        # Clean the response to remove any asterisks
        return clean_response_text(response.text.strip())
    except Exception as e:
        print(f"Error generating answer: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, returning fallback answer")
            return fallback_answer(context, question)
        else:
            return fallback_answer(context, question)

def smart_search_documents(documents_data, search_query):
    """
    Perform semantic search across multiple documents using AI
    """
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback text search")
        return fallback_text_search(documents_data, search_query)
    
    try:
        # Prepare document context for AI
        documents_context = ""
        for doc_data in documents_data:
            doc_id, title, content = doc_data
            # Truncate content if too long to fit in context window
            truncated_content = content[:2000] if len(content) > 2000 else content
            documents_context += f"\n\n--- Document ID: {doc_id} | Title: {title} ---\n{truncated_content}"
        
        prompt = f"""
        You are a smart search assistant. Search through the following documents and find the most relevant information for the user's query.
        
        User Query: "{search_query}"
        
        Documents to search through:
        {documents_context}
        
        Please provide:
        1. A list of relevant document IDs (in order of relevance)
        2. For each relevant document, provide:
           - Document title
           - A brief snippet (1-2 sentences) showing why it's relevant
           - A relevance score (1-10, where 10 is most relevant)
        
        IMPORTANT: Do not use asterisks (*) anywhere in your response. Use plain text formatting only.
        
        Format your response as JSON:
        {{
            "results": [
                {{
                    "document_id": "1",
                    "title": "Document Title",
                    "snippet": "Relevant text snippet that matches the query...",
                    "relevance_score": 8
                }}
            ],
            "total_found": 2,
            "search_summary": "Brief summary of what was found"
        }}
        """
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=generation_config
        )
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini AI")
        
        # Clean and parse the response
        response_text = response.text.strip()
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        # Remove asterisks from the response before parsing
        response_text = clean_response_text(response_text)
        
        search_results = json.loads(response_text)
        return search_results
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error in smart search: {e}")
        # Fallback to basic text search
        return fallback_text_search(documents_data, search_query)
    except Exception as e:
        print(f"Error in smart search: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, falling back to basic text search")
            return fallback_text_search(documents_data, search_query)
        else:
            # For other errors, try fallback search
            return fallback_text_search(documents_data, search_query)

def generate_search_suggestions(documents_data, partial_query):
    """
    Generate search suggestions based on document content and partial user input
    """
    # Check if client is available
    if not client:
        print("Gemini client not available, using fallback suggestions")
        return fallback_suggestions(documents_data, partial_query)
    
    try:
        if len(partial_query) < 2:
            return []
        
        # Extract key topics and terms from documents
        documents_context = ""
        for doc_data in documents_data[:5]:  # Limit to first 5 documents for speed
            doc_id, title, content = doc_data
            # Use title and first 500 chars for suggestions
            truncated_content = content[:500] if len(content) > 500 else content
            documents_context += f"\n--- {title} ---\n{truncated_content}"
        
        prompt = f"""
        Based on the following documents and the user's partial input, suggest 5-8 relevant search queries that the user might want to search for.
        
        User's partial input: "{partial_query}"
        
        Document content:
        {documents_context}
        
        Generate suggestions that:
        1. Start with or contain the user's input
        2. Are relevant to the document content
        3. Are complete, meaningful search queries
        4. Help users discover content in their documents
        
        IMPORTANT: Do not use asterisks (*) in the suggestions. Use plain text only.
        
        Format as JSON array:
        {{
            "suggestions": [
                "machine learning algorithms",
                "neural network architecture", 
                "data preprocessing techniques"
            ]
        }}
        
        Only return suggestions that would be useful for searching these specific documents.
        """
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=generation_config
        )
        
        if not response or not response.text:
            return []
        
        # Clean and parse the response
        response_text = response.text.strip()
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        # Remove asterisks from the response before parsing
        response_text = clean_response_text(response_text)
        
        suggestions_data = json.loads(response_text)
        suggestions = suggestions_data.get('suggestions', [])
        
        # Filter suggestions to only include those that contain the partial query
        filtered_suggestions = []
        for suggestion in suggestions:
            # Clean each suggestion to remove any asterisks
            clean_suggestion = clean_response_text(suggestion)
            if partial_query.lower() in clean_suggestion.lower():
                filtered_suggestions.append(clean_suggestion)
        
        return filtered_suggestions[:6]  # Limit to 6 suggestions
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error in suggestions: {e}")
        return fallback_suggestions(documents_data, partial_query)
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        # Check if it's a model overload error
        if "503" in str(e) or "overloaded" in str(e).lower() or "unavailable" in str(e).lower():
            print("Model is overloaded, falling back to basic suggestions")
            return fallback_suggestions(documents_data, partial_query)
        else:
            return fallback_suggestions(documents_data, partial_query)

def fallback_text_search(documents_data, search_query):
    """
    Fallback text search when AI search is unavailable
    """
    try:
        search_query_lower = search_query.lower()
        results = []
        
        for doc_data in documents_data:
            doc_id, title, content = doc_data
            title_lower = title.lower()
            content_lower = content.lower()
            
            # Calculate simple relevance score
            relevance_score = 0
            
            # Check title matches
            if search_query_lower in title_lower:
                relevance_score += 5
            
            # Check content matches
            if search_query_lower in content_lower:
                relevance_score += 3
                
                # Find snippet around the match
                start_pos = content_lower.find(search_query_lower)
                if start_pos != -1:
                    snippet_start = max(0, start_pos - 50)
                    snippet_end = min(len(content), start_pos + len(search_query_lower) + 50)
                    snippet = content[snippet_start:snippet_end]
                    if snippet_start > 0:
                        snippet = "..." + snippet
                    if snippet_end < len(content):
                        snippet = snippet + "..."
                else:
                    snippet = content[:100] + "..." if len(content) > 100 else content
            else:
                # No direct match, check for partial matches
                words = search_query_lower.split()
                for word in words:
                    if len(word) > 2 and word in content_lower:
                        relevance_score += 1
                snippet = content[:100] + "..." if len(content) > 100 else content
            
            if relevance_score > 0:
                results.append({
                    "document_id": str(doc_id),
                    "title": title,
                    "snippet": snippet,
                    "relevance_score": min(relevance_score, 10)
                })
        
        # Sort by relevance score
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return {
            "results": results[:10],  # Limit to top 10 results
            "total_found": len(results),
            "search_summary": f"Found {len(results)} documents using basic text search (AI search unavailable)"
        }
        
    except Exception as e:
        print(f"Error in fallback text search: {e}")
        return {
            "results": [],
            "total_found": 0,
            "search_summary": "Search temporarily unavailable. Please try again later."
        }

def fallback_suggestions(documents_data, partial_query):
    """
    Fallback suggestions when AI suggestions are unavailable
    """
    try:
        suggestions = []
        partial_query_lower = partial_query.lower()
        
        # Extract common words from document titles and content
        common_terms = set()
        
        for doc_data in documents_data[:5]:  # Limit to first 5 documents
            doc_id, title, content = doc_data
            
            # Extract words from title
            title_words = title.lower().split()
            for word in title_words:
                if len(word) > 3 and word not in ['the', 'and', 'for', 'with', 'from', 'this', 'that']:
                    common_terms.add(word)
            
            # Extract words from content (first 500 chars)
            content_words = content[:500].lower().split()
            for word in content_words:
                if len(word) > 3 and word not in ['the', 'and', 'for', 'with', 'from', 'this', 'that']:
                    common_terms.add(word)
        
        # Generate suggestions based on partial query
        for term in common_terms:
            if partial_query_lower in term or term.startswith(partial_query_lower):
                suggestion = f"{partial_query}{term[len(partial_query_lower):]}"
                if suggestion not in suggestions:
                    suggestions.append(suggestion)
        
        # Add some generic suggestions
        generic_suggestions = [
            f"{partial_query} concepts",
            f"{partial_query} examples",
            f"{partial_query} methods",
            f"{partial_query} techniques"
        ]
        
        for suggestion in generic_suggestions:
            if len(suggestions) < 6:
                suggestions.append(suggestion)
        
        return suggestions[:6]
        
    except Exception as e:
        print(f"Error in fallback suggestions: {e}")
        return []

def fallback_summary(text_content):
    """
    Generate a basic summary when AI is unavailable
    """
    try:
        # Create a simple summary by taking the first few sentences
        sentences = text_content.split('.')
        summary_sentences = []
        word_count = 0
        
        for sentence in sentences:
            if word_count >= 50:  # Limit to ~50 words
                break
            if sentence.strip():
                summary_sentences.append(sentence.strip())
                word_count += len(sentence.split())
        
        summary = '. '.join(summary_sentences) + '.'
        
        if len(summary) > 500:  # Truncate if too long
            summary = summary[:500] + "..."
        
        return f"Basic Summary (AI unavailable): {summary}"
        
    except Exception as e:
        print(f"Error in fallback summary: {e}")
        return "Summary temporarily unavailable. Please try again later."

def fallback_quiz(text_content):
    """
    Generate a basic quiz when AI is unavailable
    """
    try:
        # Create simple questions based on text content
        sentences = text_content.split('.')
        questions = []
        
        # Extract key terms and concepts
        words = text_content.lower().split()
        key_terms = [word for word in words if len(word) > 5 and word.isalpha()]
        
        # Create simple questions
        for i in range(min(5, len(sentences))):
            if sentences[i].strip():
                question_text = f"What is discussed in this text about {sentences[i][:50]}...?"
                questions.append({
                    "question": question_text,
                    "options": [
                        "It is explained in detail",
                        "It is briefly mentioned", 
                        "It is not discussed",
                        "It is only referenced"
                    ],
                    "answer": "It is explained in detail"
                })
        
        # Fill remaining questions if needed
        while len(questions) < 5:
            questions.append({
                "question": "What is the main topic of this document?",
                "options": [
                    "Technology and innovation",
                    "Business and management",
                    "Science and research",
                    "Education and learning"
                ],
                "answer": "Education and learning"
            })
        
        return {
            "questions": questions[:5],
            "fallback_mode": True
        }
        
    except Exception as e:
        print(f"Error in fallback quiz: {e}")
        return {
            "questions": [],
            "fallback_mode": True,
            "error": "Quiz generation temporarily unavailable"
        }

def fallback_flashcards(text_content):
    """
    Generate basic flashcards when AI is unavailable
    """
    try:
        # Extract key terms from text
        words = text_content.lower().split()
        key_terms = [word for word in words if len(word) > 4 and word.isalpha()]
        
        flashcards = []
        
        # Create simple flashcards
        for i in range(min(5, len(key_terms))):
            term = key_terms[i].title()
            flashcards.append({
                "front": f"What is {term}?",
                "back": f"{term} is a concept discussed in this document."
            })
        
        # Fill remaining flashcards if needed
        while len(flashcards) < 5:
            flashcards.append({
                "front": "What is the main topic?",
                "back": "The main topic is discussed throughout this document."
            })
        
        return {
            "flashcards": flashcards[:5],
            "fallback_mode": True
        }
        
    except Exception as e:
        print(f"Error in fallback flashcards: {e}")
        return {
            "flashcards": [],
            "fallback_mode": True,
            "error": "Flashcard generation temporarily unavailable"
        }

def fallback_answer(context, question):
    """
    Generate a basic answer when AI is unavailable
    """
    try:
        # Simple keyword matching
        question_lower = question.lower()
        context_lower = context.lower()
        
        # Check if question words appear in context
        question_words = [word for word in question_lower.split() if len(word) > 2]
        matching_words = [word for word in question_words if word in context_lower]
        
        if matching_words:
            return f"Based on the document content, information about {', '.join(matching_words)} is discussed. Please refer to the document for detailed information."
        else:
            return "I'm unable to provide a specific answer at the moment. Please try again later or refer to the document content directly."
        
    except Exception as e:
        print(f"Error in fallback answer: {e}")
        return "Answer generation temporarily unavailable. Please try again later."