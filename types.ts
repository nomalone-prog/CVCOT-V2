
export interface ParsedListingData {
  title: string;
  price: string;
  descriptionHtml: string; // The raw HTML content of the description, as Gemini can process HTML
  itemSpecifics: { label: string; value: string }[];
  itemNumber: string; // Add itemNumber field
}

export interface EbayAdvertising {
  recommendedCampaignType: string;
  campaignInfo: string; // Combines smart and manual campaign info
  exactMatchKeywords: string[];
  phraseMatchKeywords: string[];
  broadMatchKeywords: string[];
  setupInstructions: string[];
}

export interface ItemSpecificsRecommendations {
  additions: string[]; // List of specific labels for missing item specifics
  corrections: { label: string; current_value: string; recommended_value: string; }[]; // List of existing specifics needing correction
}

export interface AuditReport {
  overallScore: number;
  titleStrategy: {
    currentTitle: string;
    recommendedTitle: string;
    score: number;
  };
  itemSpecificsRecommendations: ItemSpecificsRecommendations; // New structured item specifics
  photoAdvice: string; // Category-specific advice
  descriptionRewrite: string; // Rewritten description
  logistics: {
    postagePolicy: string;
    returnPolicy: string;
    score: number;
  };
  ebayAdvertising: EbayAdvertising;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';