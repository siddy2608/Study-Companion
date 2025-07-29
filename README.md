# 🎓 Study Companion

A comprehensive AI-powered study assistant that helps you analyze documents, generate summaries, create quizzes, flashcards, and answer questions using Google's Gemini AI.

## ✨ Features

- **📄 Document Upload & Processing**: Support for PDF, DOCX, TXT, and image files
- **🤖 AI-Powered Analysis**: Generate summaries, quizzes, and flashcards using Google Gemini
- **🔍 Smart Search**: Semantic search across all your documents
- **💬 Q&A System**: Ask questions about your documents and get AI-powered answers
- **🎨 Modern UI**: Beautiful, responsive interface with dark/light mode
- **🔐 User Authentication**: Secure user registration and login with OTP verification
- **📱 Mobile Friendly**: Responsive design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- Google Gemini API key (free tier available)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd study-companion
```

### 2. Run the Setup Script

```bash
python setup.py
```

This will:
- Install Python dependencies
- Create a `.env` file with template
- Check for PDF OCR dependencies
- Run database migrations
- Optionally create an admin account

### 3. Configure API Key

Edit the `.env` file and add your Google Gemini API key:

```env
GOOGLE_API_KEY=your_actual_api_key_here
```

**Get your API key from**: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Start the Application

**Backend (Terminal 1):**
```bash
cd study_companion
python manage.py runserver
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 📋 Manual Setup

If you prefer manual setup or the setup script doesn't work:

### Backend Setup

1. **Create Virtual Environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure Environment:**
Create a `.env` file in the root directory:
```env
GOOGLE_API_KEY=your_api_key_here
DEBUG=True
SECRET_KEY=your_secret_key_here
```

4. **Run Migrations:**
```bash
cd study_companion
python manage.py migrate
```

5. **Start Server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install Dependencies:**
```bash
cd frontend
npm install
```

2. **Start Development Server:**
```bash
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional - Email for OTP verification
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

### PDF OCR Support

For scanned PDF support, install Poppler:

**Windows:**
1. Download from: http://blog.alivate.com.au/poppler-windows/
2. Extract to a folder (e.g., `C:\poppler`)
3. Add the `bin` folder to your PATH environment variable

**macOS:**
```bash
brew install poppler
```

**Linux:**
```bash
sudo apt-get install poppler-utils
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. API Key Errors
```
Error: API Key not found. Please pass a valid API key.
```
**Solution:** Make sure your `.env` file contains a valid `GOOGLE_API_KEY`

#### 2. PDF OCR Errors
```
OCR fallback failed: Unable to get page count. Is poppler installed and in PATH?
```
**Solution:** Install Poppler (see PDF OCR Support section above)

#### 3. Rate Limiting (429 Errors)
```
Too Many Requests: Summary is already being generated
```
**Solution:** Wait 30 seconds and try again. The system prevents concurrent requests.

#### 4. Port Already in Use
```
Error: Port 8000 is already in use
```
**Solution:** 
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
# Or use a different port
python manage.py runserver 8001
```

#### 5. Frontend Build Errors
```
Module not found: Can't resolve 'react'
```
**Solution:** 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

1. **Reduce API Calls**: The system caches results to minimize API usage
2. **Document Size**: Large documents are automatically truncated to save tokens
3. **Concurrent Requests**: Rate limiting prevents API abuse

### Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for admin accounts
- Keep your API key secure and rotate it regularly
- The application uses Django's built-in security features

## 📁 Project Structure

```
study-companion/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── contexts/       # React contexts
│   └── public/             # Static files
├── study_companion/         # Django backend
│   ├── core/               # Main app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── services.py     # AI services
│   │   └── serializers.py  # API serializers
│   ├── media/              # Uploaded files
│   └── manage.py           # Django management
├── venv/                   # Python virtual environment
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
├── setup.py               # Setup script
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information about your problem

## 🔄 Updates

To update the application:

```bash
# Backend
cd study_companion
git pull
pip install -r requirements.txt
python manage.py migrate

# Frontend
cd frontend
git pull
npm install
npm run build
```

---

**Made with ❤️ for students and learners everywhere** 