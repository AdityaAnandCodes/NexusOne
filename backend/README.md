# NexusOne Backend - AI Resume Processing

A Node.js backend service that uses Gemini 2.5 Pro AI to automatically extract comprehensive employee information from resume files.

## 🚀 Features

- **AI-Powered Resume Processing**: Uses Google's Gemini 2.5 Pro to extract name, email, phone, and skills from resumes
- **Multiple File Format Support**: PDF, DOC, DOCX, and TXT files
- **Comprehensive Data Extraction**: Contact details and professional skills with confidence scoring
- **Secure File Upload**: 10MB file size limit with type validation
- **Rate Limiting**: Built-in protection against abuse
- **CORS Support**: Configured for frontend integration
- **Error Handling**: Comprehensive error messages and validation

## 📋 Prerequisites

- Node.js 18+ installed
- Gemini API key from Google AI Studio
- Frontend running on port 3000 (for CORS)

## ⚙️ Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env` file and update with your Gemini API key
   - Make sure `GEMINI_API_KEY` is set

4. **Start the server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## 🔧 Environment Variables

```bash
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,doc,docx,txt
```

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status and timestamp

### Process Resume
- **POST** `/api/process-resume`
- Upload a resume file for AI processing
- **Body**: Form data with `resume` file field
- **Returns**: Extracted name and email information

### Test Gemini
- **POST** `/api/test-gemini`
- Test Gemini AI with custom text
- **Body**: `{ "text": "your text here" }`
- **Returns**: AI response

## 🧪 Testing

1. **Start the backend server**:
   ```bash
   npm start
   ```

2. **Open the test page**:
   - Navigate to `backend/test.html` in your browser
   - Or visit: `file:///path/to/backend/test.html`

3. **Upload a resume file** and see the AI extraction in action!

## 🔄 Integration with Frontend

The backend is designed to work with the NexusOne frontend employee management system:

1. **Frontend calls**: `http://localhost:5000/api/process-resume`
2. **Upload resume file**: User uploads PDF/DOC/DOCX resume
3. **AI Processing**: Gemini extracts name, email, phone, and skills
4. **Auto-fill form**: Frontend populates employee form automatically

## 🛡️ Security Features

- **File Type Validation**: Only allows resume file types
- **File Size Limits**: Maximum 10MB uploads
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet Security**: Security headers for production
- **CORS Protection**: Configured for specific frontend origin

## 📝 Supported File Types

| Format | Extension | Description |
|--------|-----------|-------------|
| PDF | `.pdf` | Portable Document Format |
| Word | `.doc` | Microsoft Word 97-2003 |
| Word | `.docx` | Microsoft Word 2007+ |
| Text | `.txt` | Plain text files |

## 🎯 AI Processing Features

- **Name Extraction**: Identifies full names with confidence scoring
- **Email Detection**: Finds professional/personal email addresses
- **Phone Number Extraction**: Detects and formats contact numbers
- **Skills Recognition**: Identifies technical and professional skills
- **Confidence Scoring**: Provides accuracy metrics (0-1 scale) for all fields
- **Fallback Processing**: Manual extraction if JSON parsing fails
- **Data Validation**: Ensures extracted information quality

## 🔍 Example Response

```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "phone": "+1234567890",
    "skills": ["JavaScript", "React", "Node.js", "Project Management"],
    "confidence": {
      "name": 0.9,
      "email": 0.8,
      "phone": 0.7,
      "skills": 0.85
    },
    "warnings": []
  },
  "metadata": {
    "filename": "resume.pdf",
    "fileSize": 245760,
    "extractedTextLength": 1248,
    "processedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🚀 Deployment

For production deployment:

1. **Set environment to production**:
   ```bash
   NODE_ENV=production
   ```

2. **Use process manager**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name nexusone-backend
   ```

3. **Configure reverse proxy** (nginx/apache) for HTTPS

## 🛠️ Development

- **Hot reloading**: `npm run dev` (uses nodemon)
- **Logging**: Console logs for debugging
- **Error handling**: Comprehensive error responses
- **CORS**: Pre-configured for localhost:3000

## 📚 Dependencies

- **express**: Web framework
- **multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **mammoth**: Word document processing
- **@google/generative-ai**: Gemini AI SDK
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting
- **dotenv**: Environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

Part of the NexusOne SaaS platform - Internal use only.
