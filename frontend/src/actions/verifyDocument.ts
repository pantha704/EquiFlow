'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from 'node:crypto';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function verifyDocumentAction(formData: FormData) {
  console.log("Starting verification...");

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return {
      verified: false,
      valuation: 0,
      reasoning: "Server configuration error: API Key missing."
    };
  }

  const file = formData.get("file") as File;

  if (!file) {
    return {
      verified: false,
      valuation: 0,
      reasoning: "No file provided."
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // 1. Calculate deterministic hash of the file for consistent valuation
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const hashInt = BigInt('0x' + fileHash);

    // Generate a deterministic value between 500k and 5M based on file content
    const minVal = 500000;
    const maxVal = 5000000;
    const range = BigInt(maxVal - minVal);
    const deterministicValuation = Number((hashInt % range) + BigInt(minVal));
    const roundedValuation = Math.round(deterministicValuation / 1000) * 1000;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a strict AI auditor for a Real Estate Tokenization platform.
      Analyze this image. Your job is to verify if this is a LEGITIMATE Property Deed, Title, or official ownership document.

      CRITERIA FOR REJECTION (Return verified: false):
      - Random images (selfies, landscapes, memes, blurry photos).
      - Hand-drawn notes or unofficial looking text files.
      - Screenshots of code or irrelevant websites.
      - Documents that are clearly not related to property ownership.
      - Low quality/unreadable images where text cannot be discerned.

      CRITERIA FOR ACCEPTANCE (Return verified: true):
      - Official looking layout (headers, seals, signatures).
      - Legal terminology (Grant Deed, Warranty Deed, Certificate of Title).
      - Visible property description or address.
      - Looks like a scanned official document.

      RESPONSE FORMAT (JSON ONLY):
      If REJECTED:
      {
        "verified": false,
        "valuation": 0,
        "reasoning": "Strictly explain why this is rejected (e.g. 'This is a picture of a cat, not a deed')."
      }

      If ACCEPTED:
      {
        "verified": true,
        "valuation": 0,
        "reasoning": "Briefly confirm it looks valid and cite any visible address or legal text."
      }

      NOTE: Set valuation to 0 in the JSON. I will calculate the valuation deterministically on the server.
      IMPORTANT: Return ONLY the JSON string, no markdown formatting.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type || "image/png",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    console.log("AI Response:", text);

    // Clean up markdown code blocks if present
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const data = JSON.parse(jsonString);

      // Override the valuation with our deterministic one if verified
      if (data.verified) {
        data.valuation = roundedValuation;
      }

      return data;
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      return {
        verified: false,
        valuation: 0,
        reasoning: "AI response was invalid. Please try again."
      };
    }

  } catch (error: any) {
    console.error("AI Verification Error:", error);
    return {
      verified: false,
      valuation: 0,
      reasoning: `Internal verification error: ${error.message || "Unknown error"}`
    };
  }
}
