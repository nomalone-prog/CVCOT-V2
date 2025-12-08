
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ParsedListingData, AuditReport } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION, AUDIT_REPORT_SCHEMA } from '../constants';

// Utility to create a new GoogleGenAI instance for each API call
// This ensures that the instance picks up the latest API key if it changes via window.aistudio.openSelectKey()
const getGeminiClient = () => {
  // 1. We look for import.meta.env (Not process.env)
  // 2. We look for the VITE_ prefixed name
  const apiKey = import.meta.env.VITE_API_KEY; 

  if (!apiKey) {
    // If this error throws, it means the app can't see the key
    throw new Error("API Key is missing. Check Vercel Env Vars.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};
export async function auditListing(listingData: ParsedListingData): Promise<AuditReport> {
  const ai = getGeminiClient();

  const prompt = `
  Please analyze the following eBay listing data from eBay.co.uk and provide a comprehensive audit report in strict JSON format based on your persona as an expert UK eBay consultant.

  ---
  **Parsed Listing Data:**

  **Title:** ${listingData.title}
  **Price:** ${listingData.price}
  **Description (HTML content):**
  \`\`\`html
  ${listingData.descriptionHtml}
  \`\`\`
  **Item Specifics:**
  ${listingData.itemSpecifics.map(spec => `- ${spec.label}: ${spec.value}`).join('\n')}
  ---

  Generate the audit report. Remember the fixed scores for Photos (70/100) and Logistics (80/100) should be incorporated into the overallScore.
  `;

  try {
    // Fix: Changed 'contents: { parts: [{ text: prompt }] }' to 'contents: prompt'
    // This simplifies the content input for text-only prompts and addresses the type error.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: AUDIT_REPORT_SCHEMA,
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("No response or empty response received from Gemini API.");
    }

    try {
      const auditReport: AuditReport = JSON.parse(jsonStr);
      return auditReport;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonStr);
      throw new Error(`Failed to parse AI response as JSON. Raw response: ${jsonStr.substring(0, 200)}...`);
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    if (error.message.includes("Requested entity was not found.")) {
      // This specific error can indicate an API key issue, prompt user to re-select if aistudio API is available.
      if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
        console.warn("API key might be invalid or not selected. Prompting user to select a key.");
        // Assume key selection will be successful and proceed.
        // The new key will be picked up on the next `getGeminiClient()` call.
        await (window as any).aistudio.openSelectKey();
        throw new Error("Your API key might need to be re-selected. Please try again.");
      }
    }
    throw new Error(`Failed to get audit report from AI: ${error.message || 'Unknown API error'}`);
  }
}
