import { Type } from '@google/genai';

// 1. INPUT DATA: What we scrape from the eBay HTML
export interface ParsedListingData {
  title: string;
  price: string;
  description: string;
  descriptionHtml: string;
  itemSpecifics: { name: string; value: string }[] | Record<string, string>; // Can be array or object
  
  // NEW FIELDS FOR "CATEGORY AWARE" AUDITS
  category: string;
  itemId: string; 
}

// 2. OUTPUT DATA: What the AI gives back
export interface AuditReport {
  overallScore: number;
  titleStrategy: {
    currentTitle: string;
    recommendedTitle: string;
    score: number;
    reasoning: string; // Dynamic AI Reasoning
  };
  itemSpecificsRecommendations: {
    additions: string[];
    corrections: {
      label: string;
      current_value: string;
      recommended_value: string;
    }[];
    reasoning: string; // Dynamic AI Reasoning
  };
  photoAdvice: string;
  descriptionRewrite: string;
  descriptionChangeReasoning: string; // Dynamic AI Reasoning
  logistics: {
    postagePolicy: string;
    returnPolicy: string;
    score: number;
  };
  ebayAdvertising: {
    recommendedCampaignType: string;
    campaignInfo: string;
    exactMatchKeywords: string[];
    phraseMatchKeywords: string[];
    broadMatchKeywords: string[];
    setupInstructions: string[];
  };
}
