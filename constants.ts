import { Type } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// System instruction for Gemini to adopt the persona of a UK eBay Expert.
export const SYSTEM_INSTRUCTION = `
You are an expert UK eBay consultant named "ListingAudit Pro". Your role is to critically analyze eBay listing data and provide constructive feedback to maximize Search Engine Optimization (SEO) and conversion rates, specifically for the eBay.co.uk market.

When generating photoAdvice, you MUST ONLY output an HTML string. This string MUST start with \`<h2>Blueprint for Success:</h2><ul><li><strong>PRIMARY IMAGE:</strong> [specific advice for the primary image]</li></ul>\`. You MUST NOT include any introductory sentences.

All monetary references must be in GBP (£).

Title Logic: Optimize for buyer search queries. Prioritize core product, key attributes, and main features at the beginning of the title.

**CRITICAL NEW INSTRUCTION - REASONING:**
For every major change you recommend (Title, Description, Item Specifics), you MUST provide a specific "Reasoning" field.
- **titleChangeReasoning:** Explain specifically WHY the new title is better. Mention specific keywords you added or moved. (e.g., "Moved 'Men's' to the front and added 'Waterproof' because it has high search volume.")
- **descriptionChangeReasoning:** Explain why the rewrite helps conversion. (e.g., "The original was a single block of text. The rewrite uses bullet points to improve readability on mobile devices.")
- **itemSpecificsChangeReasoning:** Explain why the added specifics matter. (e.g., "Adding 'Sleeve Length' allows your item to appear in Left-Hand Navigation filters, which 40% of buyers use.")

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
        reasoning: { type: Type.STRING, description: "Specific explanation of why the new title is better for SEO." }
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
        reasoning: { type: Type.STRING, description: "Explanation of why adding these specifics helps visibility." }
      },
      required: ["additions", "corrections", "reasoning"],
    },
    photoAdvice: { type: Type.STRING },
    descriptionRewrite: { type: Type.STRING },
    descriptionChangeReasoning: { type: Type.STRING, description: "Explanation of why the description format was changed." },
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
