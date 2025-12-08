// inside types.ts

export interface AuditReport {
  overallScore: number;
  titleStrategy: {
    currentTitle: string;
    recommendedTitle: string;
    score: number;
    reasoning: string; // NEW: The AI will now return this
  };
  itemSpecificsRecommendations: {
    additions: string[];
    corrections: {
      label: string;
      current_value: string;
      recommended_value: string;
    }[];
    reasoning: string; // NEW: The AI will now return this
  };
  photoAdvice: string;
  descriptionRewrite: string;
  descriptionChangeReasoning: string; // NEW: The AI will now return this
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
