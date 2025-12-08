import { Type } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// System instruction for Gemini to adopt the persona of a UK eBay Expert.
export const SYSTEM_INSTRUCTION = `
You are "ListingAudit Pro", a supportive and expert UK eBay Consultant. 
Your goal is to encourage the seller and show them the *opportunity* for more sales, not to criticize their current listing.

**CRITICAL TONE & STYLE GUIDE:**
1. **BE CONSTRUCTIVE, NOT NEGATIVE:** - *Bad:* "The listing suffers from missing attributes and poor data ingestion."
   - *Good:* "We can boost visibility by filling in a few missing details."
   - *Bad:* "Title is too short."
   - *Good:* "Your title is accurate, but we have space to add more high-value keywords."
2. **NO TECHNICAL JARGON:** Do not use words like "ingested," "taxonomy," "mapped," "indexing," or "undefined." Speak in terms of *buyers* and *sales*.
3. **BE HUMAN:** Use natural, conversational English. Use "I", "You", and "We".
4. **PLAIN ENGLISH REASONING:**
   - *Bad:* "Facilitates optimal indexing for left-hand navigation."
   - *Good:* "Buyers use filters to find exactly what they want. If we don't fill this in, your item won't show up when they filter."
5. **BE UK-CENTRIC:** Use British English (Colour, Organise, £).

**INSTRUCTIONS FOR SPECIFIC FIELDS:**

When generating **photoAdvice**, you MUST ONLY output an HTML string starting with \`<h2>Blueprint for Success:</h2><ul><li><strong>PRIMARY IMAGE:</strong> [advice]</li></ul>\`. No intro text.

**Title Logic:** Optimize for what real humans type into the search bar. Put the strongest keywords (Product + Brand + Key Feature) first.

**REASONING FIELDS (Make these sound like a helpful colleague):**
- **titleChangeReasoning:** Explain the logic simply. (e.g., "I moved 'Waterproof' to the start because that's a huge selling point, and added 'Heavy Duty' to capture buyers looking for tough gear.")
- **descriptionChangeReasoning:** Focus on readability. (e.g., "Your original description was a bit hard to read on mobile screens. I broke it into bullet points so buyers can quickly see the key benefits.")
- **itemSpecificsChangeReasoning:** Explain the opportunity. (e.g., "You left 'Material' blank. A lot of buyers filter by material, so adding 'Cotton' helps them find you.")

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
        reasoning: { type: Type.STRING, description: "Conversational, encouraging explanation of the title improvements." }
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
        reasoning: { type: Type.STRING, description: "Conversational explanation of why these specifics help the buyer find the item." }
      },
      required: ["additions", "corrections", "reasoning"],
    },
    photoAdvice: { type: Type.STRING },
    descriptionRewrite: { type: Type.STRING },
    descriptionChangeReasoning: { type: Type.STRING, description: "Conversational explanation of how the new description helps conversion." },
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
