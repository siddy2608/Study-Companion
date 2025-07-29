#!/usr/bin/env python3
"""
Setup script for Study Companion
This script helps configure the application and install dependencies.
"""

import os
import sys
import subprocess
import platform

def print_header():
    print("=" * 60)
    print("🎓 Study Companion Setup")
    print("=" * 60)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Python dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Python dependencies")
        return False

def setup_environment():
    """Set up environment variables"""
    print("\n🔧 Setting up environment...")
    
    env_file = ".env"
    if os.path.exists(env_file):
        print("✅ .env file already exists")
        return True
    
    # Create .env file with template
    env_content = """# Google Gemini API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_api_key_here

# Django Settings
DEBUG=True
SECRET_KEY=django-insecure-(l^v$)bf8r$$9l1lpvdfi#n%#y-bl!z#tp##)p99mm%osj+r$f

# Email Settings (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print("✅ Created .env file with template")
        print("⚠️  Please edit .env file and add your Google API key")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def check_poppler():
    """Check if Poppler is installed for PDF OCR"""
    print("\n📄 Checking PDF OCR dependencies...")
    
    system = platform.system().lower()
    
    if system == "windows":
        # Check if poppler is in PATH
        try:
            subprocess.run(["pdftoppm", "-h"], capture_output=True, check=True)
            print("✅ Poppler is installed")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️  Poppler not found")
            print("📥 Download Poppler for Windows from: http://blog.alivate.com.au/poppler-windows/")
            print("   Extract to a folder and add it to your PATH environment variable")
            return False
    
    elif system == "darwin":  # macOS
        try:
            subprocess.run(["brew", "list", "poppler"], capture_output=True, check=True)
            print("✅ Poppler is installed via Homebrew")
            return True
        except subprocess.CalledProcessError:
            print("⚠️  Poppler not found")
            print("📥 Install with: brew install poppler")
            return False
    
    elif system == "linux":
        try:
            subprocess.run(["pdftoppm", "-h"], capture_output=True, check=True)
            print("✅ Poppler is installed")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️  Poppler not found")
            print("📥 Install with: sudo apt-get install poppler-utils")
            return False
    
    else:
        print("⚠️  Unknown operating system, please install Poppler manually")
        return False

def run_migrations():
    """Run Django migrations"""
    print("\n🗄️  Setting up database...")
    try:
        os.chdir("study_companion")
        subprocess.check_call([sys.executable, "manage.py", "migrate"])
        print("✅ Database migrations completed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to run migrations")
        return False
    finally:
        os.chdir("..")

def create_superuser():
    """Create a superuser account"""
    print("\n👤 Create admin account (optional)")
    response = input("Would you like to create an admin account? (y/n): ").lower()
    
    if response in ['y', 'yes']:
        try:
            os.chdir("study_companion")
            subprocess.run([sys.executable, "manage.py", "createsuperuser"], check=True)
            print("✅ Admin account created")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to create admin account")
            return False
        finally:
            os.chdir("..")
    else:
        print("⏭️  Skipping admin account creation")
        return True

def print_next_steps():
    """Print next steps for the user"""
    print("\n" + "=" * 60)
    print("🎉 Setup completed!")
    print("=" * 60)
    print("\n📋 Next steps:")
    print("1. Edit .env file and add your Google API key")
    print("2. (Optional) Configure email settings in .env for OTP functionality")
    print("3. Start the backend server:")
    print("   cd study_companion")
    print("   python manage.py runserver")
    print("4. Start the frontend (in a new terminal):")
    print("   cd frontend")
    print("   npm start")
    print("\n🌐 The application will be available at:")
    print("   Frontend: http://localhost:3000")
    print("   Backend:  http://localhost:8000")
    print("\n📚 For more information, check the README.md file")

def main():
    print_header()
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        sys.exit(1)
    
    # Check Poppler
    check_poppler()
    
    # Run migrations
    if not run_migrations():
        sys.exit(1)
    
    # Create superuser
    create_superuser()
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    main() 