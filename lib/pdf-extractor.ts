import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log("Attempting to download file from path:", filePath);

    // Method 1: Try public URL download first (since your file is public)
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policies/${filePath}`;
    console.log("Trying public URL:", publicUrl);

    let buffer: Buffer;

    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        console.log(
          "Successfully downloaded via public URL, size:",
          buffer.length,
          "bytes"
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (publicError) {
      console.log("Public URL failed, trying private download:", publicError);

      // Method 2: Fallback to private download
      const { data: fileData, error } = await supabaseAdmin.storage
        .from("policies")
        .download(filePath);

      if (error || !fileData) {
        console.error("Supabase private download error:", error);
        return "";
      }

      const arrayBuffer = await fileData.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    console.log("Downloaded file, size:", buffer.length, "bytes");

    // Validate buffer before processing
    if (buffer.length === 0) {
      console.error("Buffer is empty");
      return "";
    }

    // Check if buffer contains PDF magic bytes
    const pdfHeader = buffer.slice(0, 20);
    console.log("Buffer header as string:", pdfHeader.toString());
    console.log("Buffer first 20 bytes as hex:", pdfHeader.toString("hex"));

    if (!buffer.slice(0, 4).toString().startsWith("%PDF")) {
      console.error("File doesn't appear to be a valid PDF");
      console.error("Actual content start:", buffer.slice(0, 100).toString());
      return "";
    }

    console.log("PDF header validation passed");

    // Use pdfjs-dist directly (more reliable than pdf-parse)
    try {
      const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");

      // Configure pdfjs worker (important for server-side)
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        // Disable worker for server-side processing
        disableWorker: true,
        // Disable streams to avoid file system access
        disableStream: true,
        // Disable font face loading
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      console.log("PDF loaded successfully, pages:", pdf.numPages);

      let fullText = "";

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");

          fullText += pageText + "\n\n";
          console.log(`Page ${pageNum} extracted, length: ${pageText.length}`);
        } catch (pageError) {
          console.error(`Error extracting page ${pageNum}:`, pageError);
        }
      }

      console.log(
        "Successfully extracted text, total length:",
        fullText.length
      );
      return fullText.trim();
    } catch (pdfjsError) {
      console.error("pdfjs-dist failed:", pdfjsError);

      // Fallback to pdf-parse with better error handling
      return await tryPdfParse(buffer);
    }
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return "";
  }
}

// Fallback function to try pdf-parse
async function tryPdfParse(buffer: Buffer): Promise<string> {
  try {
    console.log("Trying pdf-parse as fallback...");

    // Dynamic import to avoid early file system access
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const result = await pdfParse(buffer, {
      max: 0, // no page limit
    });

    console.log("pdf-parse successful, text length:", result.text.length);
    return result.text.trim();
  } catch (error) {
    console.error("pdf-parse also failed:", error);
    return await extractTextFallback(buffer);
  }
}

// Last resort fallback - extract readable text from PDF buffer
async function extractTextFallback(buffer: Buffer): Promise<string> {
  try {
    console.log("Using fallback text extraction...");

    // Convert buffer to string and try to extract readable text
    const text = buffer.toString("latin1"); // Use latin1 to preserve bytes

    // Extract text between parentheses (common PDF text storage)
    const textMatches = text.match(/\(([^)]+)\)/g);
    if (textMatches) {
      const extractedText = textMatches
        .map((match) => match.replace(/[()]/g, ""))
        .filter((text) => text.length > 1 && /[a-zA-Z]/.test(text))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        "Fallback extraction found text length:",
        extractedText.length
      );
      return extractedText;
    }

    // Try extracting text between Tj operators
    const tjMatches = text.match(/\(([^)]*)\)\s*Tj/g);
    if (tjMatches) {
      const extractedText = tjMatches
        .map((match) => match.replace(/\(([^)]*)\)\s*Tj/g, "$1"))
        .filter((text) => text.length > 0)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        "Fallback Tj extraction found text length:",
        extractedText.length
      );
      return extractedText;
    }

    console.log("No readable text found in fallback extraction");
    return "";
  } catch (error) {
    console.error("Fallback extraction failed:", error);
    return "";
  }
}
