
import { ParsedListingData } from '../types';

export function parseeBayListingHTML(htmlContent: string): ParsedListingData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // --- Title Extraction ---
  const titleSelectors = [
    'h1.x-item-title__mainTitle',       // Most common modern selector
    'span.l-title-text',                // Found on some newer layouts
    'h1#itemTitle',                     // Older eBay title ID
    'h1.product-title',                 // Another common pattern
    '.vi-title h1',                     // Title within a specific container
    '#itemTitle_feature_div span',      // Sometimes wrapped in a span
    '#item-title',                      // A generic but possible ID
    'h1[itemprop="name"]',              // Schema.org
  ];

  let title = 'N/A';
  for (const selector of titleSelectors) {
    const titleEl = doc.querySelector(selector);
    if (titleEl?.textContent && titleEl.textContent.trim().length > 5) { // Check for meaningful length
      title = titleEl.textContent.trim();
      // Clean up common eBay specific prefixes/suffixes if present
      title = title.replace(/NEW LISTING|Brand New|Used - |(\([0-9]+\) )?\s*Product details - \s*eBay/i, '').trim();
      break;
    }
  }
  // Fallback to document.title if no specific element is found or it was too short/generic
  if (title === 'N/A' || !title || title.length < 5) {
    title = doc.title.replace(/\| eBay.*$/, '').replace(/Product details - eBay/i, '').trim() || 'N/A';
  }

  // --- Price Extraction ---
  let price = doc.querySelector('.x-price-primary span[itemprop="price"]')?.textContent?.trim() ||
              doc.querySelector('.x-price-primary')?.textContent?.trim() ||
              doc.querySelector('[itemprop="price"]')?.textContent?.trim() ||
              doc.querySelector('.item-price')?.textContent?.trim() ||
              'N/A';

  // Clean up price string (basic cleanup for consistent input to AI)
  price = price.replace(/[^\d.,£$€]+/g, '').replace(/(\d),(\d)/g, '$1.$2');

  // --- Description HTML Extraction ---
  let descriptionHtml = 'N/A';

  // Attempt 1: iframe with srcdoc (most reliable if present in saved HTML)
  const iframe = doc.querySelector('#desc_ifr') as HTMLIFrameElement;
  if (iframe && iframe.srcdoc) {
    const iframeDoc = parser.parseFromString(iframe.srcdoc, 'text/html');
    if (iframeDoc.body.innerHTML.trim()) {
      descriptionHtml = iframeDoc.body.innerHTML.trim();
    }
  } else if (iframe && iframe.src) {
    console.warn("eBay description iframe found with 'src' attribute. Its content is external and cannot be directly parsed due to browser security (CORS). Relying on other description elements.");
  }

  // Attempt 2: Common description divs
  const commonDescriptionSelectors = [
    'div[itemprop="description"]',              // Schema.org markup (high priority)
    'div.section-description',                  // Modern eBay description section
    'div#description_content',                  // Common eBay description ID
    'div#desc_div',                             // Another common description ID
    'div#fullItemDesc',                         // Full item description
    'div.item-description',                     // Generic class
    'div.item-description-wrapper',             // Wrapper class
    'div.description-text',                     // Text content class
    'div[data-testid="description-content"]',   // Modern data-testid
    '.ui-pdp-description__content',             // Often seen in mobile-like saved pages
    'div[role="tabpanel"][aria-labelledby="desc-tab"]', // For tabbed descriptions
    '#Body #tg_pbox #content'                   // General for embedded description areas (older)
  ];

  if (descriptionHtml === 'N/A' || !descriptionHtml.trim() || descriptionHtml.length < 50) {
    for (const selector of commonDescriptionSelectors) {
      const descriptionDiv = doc.querySelector(selector);
      // Check for substantial content, and also ensure it's not a tiny element
      if (descriptionDiv && descriptionDiv.innerHTML.trim().length > 50) {
        descriptionHtml = descriptionDiv.innerHTML.trim();
        break;
      }
    }
  }

  // Attempt 3: Broad fallback to find a large content div if specific selectors failed
  if (descriptionHtml === 'N/A' || !descriptionHtml.trim() || descriptionHtml.length < 50) {
    const mainContentDiv = doc.querySelector('div.product-description-container, div.main-content, #mainContent, #Body');
    if (mainContentDiv && mainContentDiv.innerHTML.trim().length > 500) { // Look for substantial innerHTML
      descriptionHtml = `<div style="font-style: italic; color: #888;">(Potential description extracted from page, may include noise):</div>\n` +
                        mainContentDiv.innerHTML.trim().substring(0, 10000); // Truncate to avoid API limits
      if (mainContentDiv.innerHTML.trim().length > 10000) {
          descriptionHtml += '... (truncated)';
      }
    } else {
        // Last resort: raw body text if no other substantial content found
        const bodyText = doc.body.textContent;
        if (bodyText && bodyText.trim().length > 500) {
            descriptionHtml = `<div style="font-style: italic; color: #888;">(Potential description extracted from page body, may include noise):</div>\n` +
                              bodyText.trim().substring(0, 10000);
            if (bodyText.trim().length > 10000) {
                descriptionHtml += '... (truncated)';
            }
        }
    }
  }

  // Final check and truncation to prevent excessively long input to AI
  if (descriptionHtml !== 'N/A' && descriptionHtml.length > 20000) { // Higher limit for AI
      descriptionHtml = descriptionHtml.substring(0, 20000) + '... (truncated for AI processing)';
  }

  // --- Item Specifics Extraction ---
  const itemSpecifics: { label: string; value: string }[] = [];
  const itemSpecificsContainers = [
    '.ux-layout-section--item-details .ux-labels-values', // Modern pattern: parent of label-value pairs
    '#viTabs_0_is',                                      // Older tabbed layout specifics container
    '.item-specifics',                                   // Generic container
    '#details_list',                                     // Common ID for list of details
    '.section-details',                                  // Another details section
    'dl.item-details__list',                             // If it's a dl list
    'div[data-testid="item-specifics-section"]',         // Modern data-testid
    '.spec-group'                                        // Another common grouping for specs
  ];

  itemSpecificsContainers.forEach(containerSelector => {
    doc.querySelectorAll(containerSelector).forEach(containerEl => {
      // Try to find ux-labels-values__item pattern
      containerEl.querySelectorAll('.ux-labels-values__item').forEach(item => {
        const label = item.querySelector('.ux-textspans--bold')?.textContent?.trim();
        const value = item.querySelector('.ux-textspans--light')?.textContent?.trim();
        if (label && value && label.toLowerCase() !== 'condition:') { // Exclude "Condition" as it's often a fixed field
          itemSpecifics.push({ label: label.replace(':', ''), value });
        }
      });

      // Try to find dt/dd pattern
      containerEl.querySelectorAll('dt').forEach(dtEl => {
        const label = dtEl.textContent?.trim();
        const ddEl = dtEl.nextElementSibling;
        if (label && ddEl && ddEl.tagName === 'DD' && ddEl.textContent) {
          const value = ddEl.textContent.trim();
          if (label.toLowerCase() !== 'condition:') {
            itemSpecifics.push({ label: label.replace(':', ''), value });
          }
        }
      });

      // Try to find label/span pattern (more generic for simpler layouts)
      containerEl.querySelectorAll('label').forEach(labelEl => {
        const label = labelEl.textContent?.trim();
        const valueSpan = labelEl.nextElementSibling;
        if (label && valueSpan && (valueSpan.tagName === 'SPAN' || valueSpan.tagName === 'DIV') && valueSpan.textContent) {
          const value = valueSpan.textContent.trim();
          if (label.toLowerCase() !== 'condition:') {
            itemSpecifics.push({ label: label.replace(':', ''), value });
          }
        }
      });

      // For older table structures, if present
      containerEl.querySelectorAll('table tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (label && value && label.toLowerCase() !== 'condition:') {
            itemSpecifics.push({ label: label.replace(':', ''), value });
          }
        }
      });
    });
  });

  // Deduplicate item specifics (can happen with overlapping selectors)
  const uniqueItemSpecifics = Array.from(new Map(itemSpecifics.map(item => [item.label.toLowerCase() + item.value.toLowerCase(), item])).values());

  // --- Item Number Extraction ---
  let itemNumber = 'N/A';
  const itemNumberSelectors = [
    '#descItemNumber', // Common ID for item number in description
    'div.ux-layout-section--item-details span.ux-textspans--item-information-value', // Modern item information section
    'span[data-testid="item-information-value"]', // Specific data-testid
    'div.item-information__item-id span', // Another modern pattern
    '#vi-itm-num', // Older layout ID
    '.item-number-value' // Generic class
  ];

  for (const selector of itemNumberSelectors) {
    const itemNumEl = doc.querySelector(selector);
    if (itemNumEl?.textContent) {
      // Clean and validate: ensure it looks like a number
      const num = itemNumEl.textContent.trim().replace(/[^0-9]/g, '');
      if (num.length > 5) { // Assuming item numbers are usually long integers
        itemNumber = num;
        break;
      }
    }
  }

  // Fallback: search for "Item number: [number]" in text content
  if (itemNumber === 'N/A') {
    const bodyText = doc.body.textContent;
    if (bodyText) {
      const match = bodyText.match(/Item number:\s*([0-9]{10,})/i); // Look for 10+ digits
      if (match && match[1]) {
        itemNumber = match[1];
      }
    }
  }

  return {
    title,
    price,
    descriptionHtml,
    itemSpecifics: uniqueItemSpecifics,
    itemNumber, // Include extracted item number
  };
}