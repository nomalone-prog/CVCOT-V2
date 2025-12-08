import { ParsedListingData, AuditReport } from '../types';

/**
 * Extracts clean, readable text from an HTML string.
 */
function extractTextContent(htmlString: string): string {
  if (!htmlString) return '';

  let text = htmlString;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '\n- ');
  text = text.replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, '\n\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/\n\s*\n/g, '\n\n');
  
  return text.trim();
}

/**
 * Generates the email content for the seller based on audit data.
 */
export function generateEmailContent(parsedData: ParsedListingData, auditReport: AuditReport): { subject: string; body: string } {
  const fullTitle = parsedData.title;
  let itemNameForEmail = fullTitle;

  const titleParts = fullTitle.split(/ - | \/ | \| /);
  if (titleParts.length > 0) {
    itemNameForEmail = titleParts[0]?.trim() || fullTitle;
  }

  // FIX: Changed 'itemNumber' to 'itemId' to match your types
  const itemNumberString = parsedData.itemId && parsedData.itemId !== 'N/A' ? ` (Item Number: ${parsedData.itemId})` : '';

  const subject = `Boosting your listing: Ideas for ${itemNameForEmail}`;

  let body = `Hi [Seller Name],\n\n`;
  body += `I hope you are well. As discussed previously, reviewing your listings for improvements will greatly enhance your organic visibility but also boost the performance of any advertising or marketing tools. I have reviewed your listing for ${itemNameForEmail}${itemNumberString} and identified some key areas to capture more traffic.\n\n`;
  body += `Here is what I suggest:\n\n`;

  // 1. Title Optimization (Dynamic Reasoning)
  body += `1. Title:\n\n`;
  body += `Your current title, "${parsedData.title}" is good, but a more effective approach would be: "${auditReport.titleStrategy.recommendedTitle}".\n\n`;
  body += `Reasoning: ${auditReport.titleStrategy.reasoning}\n\n`;

  // 2. Description Update (Dynamic Reasoning)
  body += `2. Description Update:\n\n`;
  const rewrittenDescriptionText = extractTextContent(auditReport.descriptionRewrite);
  body += `${rewrittenDescriptionText}\n\n`;
  body += `Why this works: ${auditReport.descriptionChangeReasoning}\n\n`;

  // 3. Item Specifics (Dynamic Reasoning)
  body += `3. Item Specifics:\n\n`;
  if (auditReport.itemSpecificsRecommendations.additions.length > 0) {
    body += `I recommend adding these item specifics to improve searchability:\n\n`;
    auditReport.itemSpecificsRecommendations.additions.forEach(spec => {
      body += `- ${spec}\n`;
    });
    body += `\n`;
    body += `Impact: ${auditReport.itemSpecificsRecommendations.reasoning}\n\n`;
  } else {
    body += `No specific additions to item specifics are recommended at this time, indicating a strong foundation in this area.\n\n`;
  }

  // 4. Photos
  body += `4. Photos:\n\n`;
  body += `As always, visibility is highest when your first photo shows the item on a clear white background with no logo or text. Use the remaining slots to sell benefits, lifestyle use, and details.\n\n`;

  body += `Making these updates usually takes just a few minutes, but they can make a significant difference. I'm here if you have any questions!\n\n`;
  body += `Kind regards,\n[Your Name]`;

  return { subject, body };
}
