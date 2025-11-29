import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const address = formData.get("address") as string;

    if (!file || !address) {
      return NextResponse.json({ error: "Missing file or address" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: "GEMINI_API_KEY not configured",
        mock: true
      }, { status: 500 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert Real Estate Appraiser AI.
      Analyze the attached property document (Deed/Title) and the provided address: "${address}".

      Task 1: Verification
      - Check if the document actually refers to the address provided.
      - Check if it looks like a valid legal property document.

      Task 2: Valuation
      - Estimate the current market value of this property in USD based on its location and typical market rates.
      - If the document doesn't contain enough info, infer from the location (city/street) and typical property types there.
      - Be realistic but conservative.

      Output ONLY valid JSON in this format:
      {
        "isVerified": boolean,
        "verificationReason": "string (short explanation)",
        "estimatedValue": number (integer in USD),
        "confidence": "High" | "Medium" | "Low",
        "reasoning": "string (short explanation of valuation factors)"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
