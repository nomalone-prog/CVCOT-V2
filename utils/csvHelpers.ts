import { ParsedListingData, AuditReport } from '../types';

export const generateCsvContent = (
  parsedData: ParsedListingData,
  auditReport: AuditReport
): string => {
  
  // --- 1. Helper to clean text for CSV (handles commas, quotes, etc.) ---
  const escapeCsv = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '';
    const stringField = String(field);
    // Wrap in quotes if it contains comma, newline, or quote
    if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // --- 2. Extract Data ---
  
  // Item ID (Safe check in case types aren't updated)
  const itemId = (parsedData as any).itemId || 'N/A';

  // Item Specifics (Formatting list into a single string)
  let currentSpecificsStr = '';
  const rawSpecs = (parsedData as any).itemSpecifics;
  if (rawSpecs) {
    if (Array.isArray(rawSpecs)) {
       // Handle array format
       currentSpecificsStr = rawSpecs
          .map((spec: any) => `${spec.name || spec.Name}: ${spec.value || spec.Value}`)
          .join('; ');
    } else {
        // Handle object format
        currentSpecificsStr = Object.entries(rawSpecs)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
    }
  }

  const missingSpecificsStr = auditReport.itemSpecificsRecommendations.additions.join(', ');

  // Standard SEO Reasons
  const titleReason = "Optimized to prioritize high-volume keywords and place strong identifiers at the start for maximum search visibility.";
  const descriptionReason = "Restructured to remove 'walls of text', use bullet points, and improve mobile readability to boost conversion.";
  const specificsReason = "Missing Item Specifics cause listings to disappear from filtered searches (Left Hand Navigation). Adding these ensures visibility.";

  // --- 3. Build the Spreadsheet Rows ---
  const rows: string[][] = [];

  // ROW 1: Title Header
  rows.push(['Item Number', 'Current Title', 'Recommended Title', 'Why the change to Title is being suggested']);
  // ROW 2: Title Data
  rows.push([
    itemId, 
    parsedData.title, 
    auditReport.titleStrategy.recommendedTitle, 
    titleReason
  ]);

  // ROWS 3 & 4: Empty Spacers
  rows.push([]);
  rows.push([]);

  // ROW 5: Description Header
  rows.push(['Item Number', 'Current Description', 'Recommended Description', 'Why the change to description is being suggested']);
  // ROW 6: Description Data
  rows.push([
    itemId,
    (parsedData as any).description || "See Original Listing", 
    auditReport.descriptionRewrite,
    descriptionReason
  ]);

  // ROWS 7, 8, 9: Empty Spacers
  rows.push([]);
  rows.push([]);
  rows.push([]);

  // ROW 10: Item Specifics Header
  rows.push(['Item Number', 'Current Item Specifics', 'Missing Item Specifics', 'Why these specifics need to be added']);
  // ROW 11: Item Specifics Data
  rows.push([
    itemId,
    currentSpecificsStr,
    missingSpecificsStr,
    specificsReason
  ]);

  // Combine into final CSV string
  return rows.map(row => row.map(escapeCsv).join(',')).join('\n');
};
