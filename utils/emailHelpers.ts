import { ParsedListingData, AuditReport } from '../types';

/**
 * Extracts clean, readable text from an HTML string.
 * Specifically designed to turn HTML lists (<ul><li>) into plain text bullet points
 * and preserve paragraph breaks so the email doesn't look like a "wall of text".
 */
function extractTextContent(htmlString: string): string {
  if (!htmlString) return '';

  let text = htmlString;

  // 1. Replace <br> tags with a single newline
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // 2. Replace list items <li> with a newline and a dash
  text = text.replace(/<li[^>]*>/gi, '\n- ');

  // 3. Replace closing block tags (</p>, </div>, </h1>, </ul>) with double newlines
  //    This ensures separate paragraphs stay separate.
  text = text.replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, '\n\n');

  // 4. Strip all remaining HTML tags (like <b>, <span>, etc.)
  text = text.replace(/<[^>]+>/g, '');

  // 5. Decode common HTML entities to ensure text looks normal
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");

  // 6. Clean up excessive whitespace
  //    Collapses 3+ newlines into just 2, and trims the ends.
  text = text.replace(/\n\s*\n/g, '\n\n');
  
  return text.trim();
}

/**
 * Generates the email content for the seller based on audit data.
 */
export function generateEmailContent(parsedData: ParsedListingData, auditReport: AuditReport): { subject: string; body: string } {
  const fullTitle = parsedData.title;
  let itemNameForEmail = fullTitle; // Default to full title

  // Attempt to get a cleaner product name by splitting, if a clear separator exists
  const titleParts = fullTitle.split(/ - | \/ | \| /);
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
  // Now uses the improved extractor to keep bullet points formatted
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

  // 4. Photos
  body += `4. Photos:\n\n`;
  body += `As always, you will always capture better visibility when your first photo is the item on a clear white background with no logo or text. Then you have up to 23 other photos to sell the benefits and features, photos of it being used and so on with all the logos and text you want!\n\n`;

  body += `Making these updates usually takes just a few minutes, but they can make a significant difference in visibility. I'm here if you have any questions!\n\n`;
  body += `Kind regards,\nTeammate Name`;

  return { subject, body };
}
