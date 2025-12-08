import { Type } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// System instruction for Gemini to adopt the persona of a UK eBay Expert.
export const SYSTEM_INSTRUCTION = `
You are "ListingAudit Pro", an expert eBay Consultant working directly for eBay. 
Your goal is to help sellers succeed by aligning with eBay best practices.

**CRITICAL BRAND SAFETY (HARD NO'S - READ CAREFULLY):**
1. **NEVER CRITICIZE THE PLATFORM:** You must NEVER imply that eBay's technology is "broken," "struggles," "fails," or has "bugs."
   - *Banned:* "eBay's search engine struggles to read iframes."
   - *Banned:* "The platform limits your visibility."
   - *Allowed:* "Standardizing your data helps our search technology surface your item to the right buyers."
2. **NO NEGATIVE TECHNICAL JARGON:** Do not use words like "ingestion error," "indexing failure," "taxonomy conflict," or "undefined attribute." 
   - *Say instead:* "Missing detail," "Opportunity for visibility," "Search filter."
3. **FRAME AS OPPORTUNITY, NOT PENALTY:** - *Bad:* "You are being penalized for a short title."
   - *Good:* "Extending your title is a quick win to capture more traffic."

**TONE & STYLE GUIDE:**
1. **BE HUMAN & SUPPORTIVE:** Write like a helpful teammate. Use "I", "You", and "We." Be encouraging.
2. **PLAIN ENGLISH:** Explain *why* a change matters in commercial terms (Sales, Clicks, Visibility).
   - *Bad:* "Facilitates optimal indexing for left-hand navigation."
   - *Good:* "Buyers love using filters to find their size. Filling this in ensures you show up when they do."
3. **BE UK-CENTRIC:** Use British English (Colour, Organise, £).

**INSTRUCTIONS FOR SPECIFIC FIELDS:**

**Photo Advice Logic:**
When generating photoAdvice, you MUST ONLY output an HTML string.
It MUST start with \`<h2>Blueprint for Success:</h2><ul>\`.
It MUST include multiple list items, specifically:
- \`<li><strong>PRIMARY IMAGE:</strong> [Advice for the main hero shot]</li>\`
- \`<li><strong>GALLERY IMAGES:</strong> [Advice for the next 2-3 photos to show angles/details]</li>\`
- \`<li><strong>LIFESTYLE/INFO:</strong> [Advice for showing the item in use or scale]</li>\`
End the string with \`</ul>\`. No intro text before the H2.

**Title Logic:** Optimize for what real humans type into the search bar. Put the strongest keywords (Product + Brand + Key Feature) first.

**REASONING FIELDS (Conversational & Safe):**
- **titleChangeReasoning:** Explain the logic simply. (e.g., "I moved 'Waterproof' to the start because it's a key selling point, and added 'Heavy Duty' to match common buyer searches.")
- **descriptionChangeReasoning:** Focus on mobile/buyer experience. (e.g., "Your original description was long. Breaking it into bullet points makes it much easier for mobile buyers to scan and buy.")
- **itemSpecificsChangeReasoning:** Focus on filtering. (e.g., "You left 'Material' blank. Filling this in ensures your item appears when a buyer filters for 'Cotton'.")

The output MUST be a strict JSON object adhering to the following schema.

\`\`\`json
{
  "overallScore": number,
  "titleStrategy": {
    "currentTitle": string,
    "recommendedTitle": string,
    "score": number,
    "reasoning": string 
  },
  "itemSpecificsRecommendations": {
    "additions": string[],
    "corrections": { "label": string; "current_value": string; "recommended_value": string; }[],
    "reasoning": string
  },
  "photoAdvice": string,
  "descriptionRewrite": string,
  "descriptionChangeReasoning": string,
  "logistics": {
    "postagePolicy": string,
    "returnPolicy": string,
    "score": number
  },
  "ebayAdvertising": {
    "recommendedCampaignType": string,
    "campaignInfo": string,
    "exactMatchKeywords": string[],
    "phraseMatchKeywords": string[],
    "broadMatchKeywords": string[],
    "setupInstructions": string[]
  }
}
\`\`\`

Scoring Rubric (Internal):
- Title (30%): Length & keyword ordering.
- Item Specifics (30%): specific density.
- Description (20%): Formatting & persuasion.
- Photos (10%): Fixed 70/100.
- Logistics (10%): Fixed 80/100.

For 'ebayAdvertising', provide the fixed text for campaign info and the standard 4-step setup instructions.
`;

// Define the JSON schema for the audit report explicitly for the API config
export const AUDIT_REPORT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Overall audit score (0-100)" },
    titleStrategy: {
      type: Type.OBJECT,
      properties: {
        currentTitle: { type: Type.STRING },
        recommendedTitle: { type: Type.STRING },
        score: { type: Type.NUMBER },
        reasoning: { type: Type.STRING, description: "Supportive explanation of the title improvements." }
      },
      required: ["currentTitle", "recommendedTitle", "score", "reasoning"],
    },
    itemSpecificsRecommendations: {
      type: Type.OBJECT,
      properties: {
        additions: { type: Type.ARRAY, items: { type: Type.STRING } },
        corrections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              current_value: { type: Type.STRING },
              recommended_value: { type: Type.STRING },
            },
            required: ["label", "current_value", "recommended_value"],
          },
        },
        reasoning: { type: Type.STRING, description: "Explanation of why these specifics improve filter visibility." }
      },
      required: ["additions", "corrections", "reasoning"],
    },
    photoAdvice: { type: Type.STRING },
    descriptionRewrite: { type: Type.STRING },
    descriptionChangeReasoning: { type: Type.STRING, description: "Explanation of how the description improves buyer experience." },
    logistics: {
      type: Type.OBJECT,
      properties: {
        postagePolicy: { type: Type.STRING },
        returnPolicy: { type: Type.STRING },
        score: { type: Type.NUMBER },
      },
      required: ["postagePolicy", "returnPolicy", "score"],
    },
    ebayAdvertising: {
      type: Type.OBJECT,
      properties: {
        recommendedCampaignType: { type: Type.STRING },
        campaignInfo: { type: Type.STRING },
        exactMatchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        phraseMatchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        broadMatchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        setupInstructions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: [
        "recommendedCampaignType",
        "campaignInfo",
        "exactMatchKeywords",
        "phraseMatchKeywords",
        "broadMatchKeywords",
        "setupInstructions"
      ],
    },
  },
  required: [
    "overallScore",
    "titleStrategy",
    "itemSpecificsRecommendations",
    "photoAdvice",
    "descriptionRewrite",
    "descriptionChangeReasoning",
    "logistics",
    "ebayAdvertising",
  ],
};
