const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class TextExtractor {
  /**
   * Extract text from various file types
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(file) {
    try {
      const { buffer, mimetype, originalname } = file;

      console.log(`🔍 Extracting text from ${originalname} (${mimetype})`);

      switch (mimetype) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromWord(buffer);
        
        case 'text/plain':
          return buffer.toString('utf-8');
        
        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains no extractable text');
      }

      console.log(`📄 PDF text extracted: ${text.length} characters`);
      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Word documents (.doc and .docx)
   * @param {Buffer} buffer - Word file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      if (!text || text.trim().length === 0) {
        throw new Error('Word document appears to be empty or contains no extractable text');
      }

      if (result.messages && result.messages.length > 0) {
        console.warn('Word extraction warnings:', result.messages);
      }

      console.log(`📝 Word text extracted: ${text.length} characters`);
      return text;
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error(`Word document extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  }

  /**
   * Validate extracted text quality
   * @param {string} text - Extracted text
   * @returns {Object} - Validation results
   */
  validateText(text) {
    const validation = {
      isValid: true,
      warnings: [],
      stats: {
        length: text.length,
        wordCount: text.split(/\s+/).length,
        lineCount: text.split('\n').length
      }
    };

    // Check minimum length
    if (text.length < 50) {
      validation.warnings.push('Text is very short, may not contain sufficient information');
    }

    // Check for common resume keywords
    const resumeKeywords = ['experience', 'education', 'skills', 'work', 'job', 'career', 'professional'];
    const foundKeywords = resumeKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length === 0) {
      validation.warnings.push('Text does not appear to contain typical resume content');
    }

    // Check for email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    validation.stats.emailCount = emails ? emails.length : 0;

    // Check for name patterns (capitalized words)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const names = text.match(namePattern);
    validation.stats.namePatternCount = names ? names.length : 0;

    return validation;
  }
}

module.exports = new TextExtractor();
