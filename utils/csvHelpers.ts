import { ParsedListingData, AuditReport } from '../types';

export const generateCsvContent = (
  parsedData: ParsedListingData,
  auditReport: AuditReport
): string => {
  
  // --- 1. Helper to clean text for CSV ---
  const escapeCsv = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '';
    const stringField = String(field);
    if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // --- 2. Helper to Format HTML to Clean Text ---
  const cleanHtml = (html: string): string => {
    if (!html) return '';
    let text = html;
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<li>/gi, '• ');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    text = text.replace(/<[^>]+>/g, '');
    return text.replace(/\n\s*\n/g, '\n\n').trim();
  };

  // --- 3. Extract & Clean Data ---
  const itemId = (parsedData as any).itemId || 'N/A';

  // Item Specifics
  let currentSpecificsStr = '';
  const rawSpecs = (parsedData as any).itemSpecifics;
  if (rawSpecs) {
    if (Array.isArray(rawSpecs)) {
       currentSpecificsStr = rawSpecs
          .map((spec: any) => `${spec.name || spec.Name}: ${spec.value || spec.Value}`)
          .join('\n');
    } else {
        currentSpecificsStr = Object.entries(rawSpecs)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
    }
  }

  const missingSpecificsStr = auditReport.itemSpecificsRecommendations.additions.join('\n');
  const currentDesc = cleanHtml((parsedData as any).description || "See Original Listing");
  const recommendedDesc = cleanHtml(auditReport.descriptionRewrite);

  // --- 4. DYNAMIC REASONING (UPDATED) ---
  // Now we pull the specific "Why" from the AI report
  const titleReason = auditReport.titleStrategy.reasoning;
  const descriptionReason = auditReport.descriptionChangeReasoning;
  const specificsReason = auditReport.itemSpecificsRecommendations.reasoning;

  // --- 5. Build the Spreadsheet Rows ---
  const rows: string[][] = [];

  // ROW 1: Title Header
  rows.push(['Item Number', 'Current Title', 'Recommended Title', 'Why the change to Title is being suggested']);
  // ROW 2
  rows.push([
    itemId, 
    parsedData.title, 
    auditReport.titleStrategy.recommendedTitle, 
    titleReason
  ]);

  rows.push([]);
  rows.push([]);

  // ROW 5: Description Header
  rows.push(['Item Number', 'Current Description', 'Recommended Description', 'Why the change to description is being suggested']);
  // ROW 6
  rows.push([
    itemId,
    currentDesc, 
    recommendedDesc,
    descriptionReason
  ]);

  rows.push([]);
  rows.push([]);

  // ROW 10: Item Specifics Header
  rows.push(['Item Number', 'Current Item Specifics', 'Missing Item Specifics', 'Why these specifics need to be added']);
  // ROW 11
  rows.push([
    itemId,
    currentSpecificsStr,
    missingSpecificsStr,
    specificsReason
  ]);

  return rows.map(row => row.map(escapeCsv).join(',')).join('\n');
};
