import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ParsedListingData, AuditReport } from '../types';
import { SYSTEM_INSTRUCTION, AUDIT_REPORT_SCHEMA } from '../constants';

// Utility to create a new GoogleGenAI instance for each API call
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY; 

  if (!apiKey) {
    throw new Error("API Key is missing. Check Vercel Env Vars.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper function to pause execution (used for retries)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function auditListing(listingData: ParsedListingData): Promise<AuditReport> {
  const ai = getGeminiClient();

  // Updated Prompt with strict 80-character limit
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

  **CRITICAL INSTRUCTIONS:**
  1. Generate the audit report. 
  2. The fixed scores for Photos (70/100) and Logistics (80/100) should be incorporated into the overallScore.
  3. **STRICT TITLE LIMIT:** The 'recommendedTitle' MUST be **80 characters or less**. eBay enforces a hard limit. Count the characters carefully. If your generated title is longer than 80 characters, you MUST shorten it by removing filler words or synonyms. Do not output a title longer than 80 chars.
  `;

  // Retry Logic Configuration
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Force use of Flash model for speed and reliability
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

      // Try parsing the JSON
      try {
        const auditReport: AuditReport = JSON.parse(jsonStr);
        return auditReport;
      } catch (parseError) {
        console.error("Failed to parse JSON response:", jsonStr);
        throw new Error(`Failed to parse AI response as JSON.`);
      }

    } catch (error: any) {
      // Check for Overload (503) or Rate Limit (429) errors
      const isOverloaded = error.message?.includes("503") || error.message?.includes("overloaded") || error.code === 503;
      
      if (isOverloaded && attempt < MAX_RETRIES - 1) {
        attempt++;
        const waitTime = 1000 * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, etc.
        console.warn(`Gemini 503 Overload. Retrying attempt ${attempt} in ${waitTime}ms...`);
        await delay(waitTime);
        continue; // Retry the loop
      }

      // If it's not a recoverable error, or we ran out of retries, handle normally:
      console.error("Gemini API error:", error);

      if (error.message?.includes("Requested entity was not found.")) {
        if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
          console.warn("API key might be invalid. Prompting user.");
          await (window as any).aistudio.openSelectKey();
          throw new Error("Your API key might need to be re-selected. Please try again.");
        }
      }
      
      // Final error throw if retries failed
      throw new Error(`Failed to get audit report from AI: ${error.message || 'Unknown API error'}`);
    }
  }

  throw new Error("Failed to retrieve audit after multiple attempts.");
}
