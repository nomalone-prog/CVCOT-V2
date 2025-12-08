

import { ParsedListingData, AuditReport } from '../types';

/**
 * Extracts clean, flowing text from an HTML string, attempting to flatten lists and
 * preserve paragraph breaks, while stripping unwanted characters.
 */
function extractTextContent(htmlString: string): string {
  if (!htmlString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const paragraphs: string[] = [];

  // Iterate over common block elements and list items to get content
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach(el => {
    let text = el.textContent?.trim();
    if (text) {
      // Replace common unwanted characters
      text = text.replace(/—/g, '-'); // Replace em-dash with hyphen

      if (el.tagName === 'LI') {
        // For list items, just add the text. We'll add a hyphen for list appearance in plain text.
        paragraphs.push(`- ${text}`);
      } else {
        paragraphs.push(text);
      }
    }
  });

  // Join paragraphs with double newlines for separation
  let finalContent = paragraphs.join('\n\n').trim();

  // Consolidate multiple newlines and spaces
  finalContent = finalContent.replace(/\n\n+/g, '\n\n');
  finalContent = finalContent.replace(/\s\s+/g, ' ');

  return finalContent;
}

/**
 * Generates the email content for the seller based on audit data.
 * Adheres to strict formatting rules (paragraph style, no emojis, em-dashes, or bullet points).
 */
export function generateEmailContent(parsedData: ParsedListingData, auditReport: AuditReport): { subject: string; body: string } {
  const fullTitle = parsedData.title;
  let itemNameForEmail = fullTitle; // Default to full title

  // Attempt to get a cleaner product name by splitting, if a clear separator exists
  const titleParts = fullTitle.split(/ - | \/ | \| /); // More robust delimiters
  if (titleParts.length > 0) {
    itemNameForEmail = titleParts[0]?.trim() || fullTitle;
  }

  // Use the extracted item number directly
  const itemNumberString = parsedData.itemNumber !== 'N/A' ? ` (Item Number: ${parsedData.itemNumber})` : '';

  const subject = `Boosting your listing: Ideas for ${itemNameForEmail}`;

  let body = `Hi [Seller Name],\n\n`;
  body += `I hope you are well. As discussed previously, reviewing your listings for improvements will greatly enhance your organic visibility but also boost the performance of any advertising or marketing tools. For example I have reviewed your listing for ${itemNameForEmail}${itemNumberString} and a few tweaks could really help it capture more traffic and secure sales. You can apply the recommendations here to your other listings too for maximum effect on your account and we can discuss in our next meeting as well.\n\n`;
  body += `Here is what I suggest:\n\n`;

  // 1. Title Optimization
  body += `1. Title:\n\n`;
  body += `Your current title, "${parsedData.title}" is good but a more effective approach would be: "${auditReport.titleStrategy.recommendedTitle}". It prioritizes distinguishing product attributes and core features earlier in the title, which is crucial for capturing specific buyer searches. This approach maximizes the use of available character limits and aligns with eBay's search algorithms to significantly boost your listing's visibility and click-through rates by directly targeting what buyers are actively seeking.\n\n`;

  // 2. Description Update
  body += `2. Description Update:\n\n`;
  // The description rewrite can contain HTML, extract plain text but preserve list-like structure for email readability
  const rewrittenDescriptionText = extractTextContent(auditReport.descriptionRewrite);
  body += `${rewrittenDescriptionText}\n\n`;
  body += `This description focuses on benefits and advantages of the product, not just details. And the bullet points will really make it easy for buyers to quickly know exactly what those benefits are.\n\n`;

  // 3. Item Specifics
  body += `3. Item Specifics:\n\n`;
  if (auditReport.itemSpecificsRecommendations.additions.length > 0) {
    body += `I recommend adding these item specifics to improve searchability:\n\n`;
    auditReport.itemSpecificsRecommendations.additions.forEach(spec => {
      body += `- ${spec}\n`;
    });
    body += `\n`; // Add an extra newline after the list
  } else {
    body += `No specific additions to item specifics are recommended at this time, indicating a strong foundation in this area.\n\n`;
  }
  // Per instructions, do not include corrections unless specific critical error logic is implemented in auditReport
  // body += `For existing specifics, consider refining the values for the following (e.g., ${auditReport.itemSpecificsRecommendations.corrections.map(c => `${c.label} from "${c.current_value}" to "${c.recommended_value}"`).join('; ')}). `;


  // 4. Photos
  body += `4. Photos:\n\n`;
  body += `As always, you will always capture better visibility when your first photo is the item on a clear white background with no logo or text. Then you have up to 23 other photos to sell the benefits and features, photos of it being used and so on with all the logos and text you want!\n\n`;

  body += `Making these updates usually takes just a few minutes, but they can make a significant difference in visibility. I'm here if you have any questions!\n\n`;
  body += `Kind regards,\nTeammate Name`;

  return { subject, body };
}