import { extractTextFromPDF } from "@/lib/pdf-extractor";
import { Company } from "@/lib/models/main";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { filePath, companyId, policyType } = await request.json();

    console.log("Extracting text for:", { filePath, companyId, policyType });

    // Extract text from PDF using the file path
    const extractedText = await extractTextFromPDF(filePath);

    if (extractedText) {
      // Update company document with extracted text
      const textField = `onboarding.policies.${policyType}Text`;
      await Company.findByIdAndUpdate(companyId, {
        [textField]: extractedText,
      });

      console.log(
        `Updated ${textField} with ${extractedText.length} characters`
      );
    }

    return NextResponse.json({
      success: true,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text" },
      { status: 500 }
    );
  }
}
