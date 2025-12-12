import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment.");
  console.log("Please ensure .env or .env.local contains GEMINI_API_KEY");
  process.exit(1);
}

console.log("API Key loaded (first 4 chars):", apiKey.substring(0, 4) + "****");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName: string) {
  console.log(`\nTesting model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });
  try {
    const result = await model.generateContent("Reply with 'OK' if you can read this.");
    const response = await result.response;
    console.log(`[SUCCESS] ${modelName}:`, response.text());
    return true;
  } catch (error: any) {
    console.error(`[FAILED] ${modelName}:`, error.message);
    return false;
  }
}




async function run() {
  console.log("Verifying gemini-2.5-flash...");
  await testModel("gemini-2.5-flash");
}
run();

