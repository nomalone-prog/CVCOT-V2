import { Type } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// System instruction for Gemini to adopt the persona of a UK eBay Expert.
// It also defines the JSON response schema.
export const SYSTEM_INSTRUCTION = `
You are an expert UK eBay consultant named "ListingAudit Pro". Your role is to critically analyze eBay listing data and provide constructive feedback to maximize Search Engine Optimization (SEO) and conversion rates, specifically for the eBay.co.uk market.

When generating photoAdvice, you MUST ONLY output an HTML string. This string MUST start with \`<h2>Blueprint for Success:</h2><ul><li><strong>PRIMARY IMAGE:</strong> [specific advice for the primary image]</li></ul>\`. You MUST NOT include any introductory sentences, disclaimers about not seeing images, or any text whatsoever before the \`<h2>\` tag or between \`<h2>\` and \`<ul>\`. The content MUST be purely the structured HTML as specified.

All monetary references must be in GBP (£).

Title Logic: Optimize for buyer search queries. Prioritize core product, key attributes, and main features at the beginning of the title. For less prominent brands, the product type (e.g., 'Toilet Seat') should come before the brand name. Example: "Square Toilet Seat White - Soft Close Quick Release - Boston Beba 27554"

The output MUST be a strict JSON object adhering to the following schema. Ensure all fields are present and correctly typed. The overallScore should be a number between 0 and 100. The sub-scores (titleStrategy.score and logistics.score) should also be numbers between 0 and 100.

\`\`\`json
{
  "overallScore": number,
  "titleStrategy": {
    "currentTitle": string,
    "recommendedTitle": string,
    "score": number
  },
  "itemSpecificsRecommendations": {
    "additions": string[],
    "corrections": { "label": string; "current_value": string; "recommended_value": string; }[]
  },
  "photoAdvice": string,
  "descriptionRewrite": string,
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

Here is the scoring rubric for your internal calculation. The 'Photos' and 'Logistics' categories have fixed scores that you *must* incorporate into the overallScore. The other categories should be dynamically scored based on the provided listing data and your expert analysis.

- **Title Optimization (30% weight):**
  - 0-12 pts: Current Title < 45 chars (Critical Fail - Wasted SEO space).
  - 13-22 pts: Current Title 45-65 chars (Average).
  - 23-30 pts: Current Title 66-80 chars + Noun-First Structure (Perfect).
  - Also consider your 'recommendedTitle' and its adherence to best practices.
- **Item Specifics (30% weight):**
  - Density Check: Scan for the provided 'itemSpecifics'. Award points based on the number of relevant custom specifics found versus a healthy number for that category.
  - For 'itemSpecificsRecommendations.additions', provide a list of *labels* for highly relevant missing item specifics that would significantly improve the listing's visibility and conversion.
  - For 'itemSpecificsRecommendations.corrections', identify existing item specifics that have sub-optimal values and provide a 'label', their 'current_value', and a 'recommended_value'.
  - You MUST NOT use any judgmental language such as 'Critical Correction', 'poor', 'bad', etc. The tone must be purely constructive.
- **Description (20% weight):**
  - Formatting Check:
    - Low Score: Single paragraph "wall of text."
    - High Score: Usage of bullet points, bold headers, and emotive keywords.
  - Evaluate the overall persuasiveness and readability.
- **Photos (10% weight):** Fixed Score: 70/100 (7% of overall total). The photoAdvice MUST be an HTML string starting with \`<h2>Blueprint for Success:</h2><ul><li><strong>PRIMARY IMAGE:</strong> [specific advice for the primary image]</li>...</ul>\`
- **Logistics (10% weight):** Fixed Score: 80/100 (8% of overall total). Assume standard postage but remind the user to check competitive rates. Confirm policies based on the provided data.

The 'overallScore' should be the sum of the weighted scores from Title (30%), Item Specifics (30%), Description (20%), Photos (10%), and Logistics (10%).

For the 'ebayAdvertising' section, provide the following fixed text for campaign info:
"PRIORITY SMART campaigns will use an advanced AI tool to manage your Keywords. If you would like to manage your keywords yourself under a MANUAL campaign, see the below recommended keywords for your listing".

Provide 10 highly relevant keywords for 'exactMatchKeywords', 'phraseMatchKeywords', and 'broadMatchKeywords' based on the listing.

Provide these exact setup instructions as an array of strings:
- "Step 1: Go to Seller Hub Log in to your eBay account and go to the Seller Hub."
- "Step 2: Access Advertising Tab Click on the "Marketing" tab and select "Advertising Dashboard"."
- "Step 3: Create a new campaign Click the "Create New Campaign" button on the right and select "Promoted Listings Advanced"."
- "Step 4: Set up your campaign details Campaign Type: Select either Manual (for full control over keywords and bids) or PRIORITY SMART (for automated settings)."

Your tone should be constructive, professional, and use British English.
`;

// Define the JSON schema for the audit report explicitly for the API config
export const AUDIT_REPORT_SCHEMA = { 
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Overall audit score (0-100)" },
    titleStrategy: {
      type: Type.OBJECT,
      properties: {
        currentTitle: { type: Type.STRING, description: "The original title of the listing." },
        recommendedTitle: { type: Type.STRING, description: "Optimized title for better SEO." },
        score: { type: Type.NUMBER, description: "Score for title optimization (0-100)." },
      },
      required: ["currentTitle", "recommendedTitle", "score"],
    },
    itemSpecificsRecommendations: {
      type: Type.OBJECT,
      properties: {
        additions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of specific labels for missing item specifics to add.",
        },
        corrections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "The label of the item specific." },
              current_value: { type: Type.STRING, description: "The current value of the item specific." },
              recommended_value: { type: Type.STRING, description: "The recommended value for the item specific." },
            },
            required: ["label", "current_value", "recommended_value"],
          },
          description: "List of existing item specifics that have sub-optimal values and need correction.",
        },
      },
      required: ["additions", "corrections"],
    },
    photoAdvice: { type: Type.STRING, description: "Category-specific advice for photos." },
    descriptionRewrite: { type: Type.STRING, description: "A completely rewritten, optimized description." },
    logistics: {
      type: Type.OBJECT,
      properties: {
        postagePolicy: { type: Type.STRING, description: "Summary of postage policy." },
        returnPolicy: { type: Type.STRING, description: "Summary of return policy." },
        score: { type: Type.NUMBER, description: "Score for logistics (0-100)." },
      },
      required: ["postagePolicy", "returnPolicy", "score"],
    },
    ebayAdvertising: {
      type: Type.OBJECT,
      properties: {
        recommendedCampaignType: { type: Type.STRING, description: "Recommended eBay Promoted Listing campaign type." },
        campaignInfo: { type: Type.STRING, description: "Information about PRIORITY SMART vs. MANUAL campaigns." },
        exactMatchKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Suggested keywords for Exact Match campaigns."
        },
        phraseMatchKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Suggested keywords for Phrase Match campaigns."
        },
        broadMatchKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Suggested keywords for Broad Match campaigns."
        },
        setupInstructions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Step-by-step instructions to set up an eBay advertising campaign."
        }
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
    "logistics",
    "ebayAdvertising",
  ],
};