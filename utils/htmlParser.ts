import { ParsedListingData } from '../types';

export const parseeBayListingHTML = (htmlContent: string): ParsedListingData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // --- 1. TITLE ---
  // Try multiple common places for the title
  let title = 'N/A';
  const titleSelectors = ['#itemTitle', 'h1.x-item-title__mainTitle', '.x-item-title'];
  for (const selector of titleSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      // Remove "Details about  " prefix if present
      title = el.textContent?.replace('Details about', '').trim() || 'N/A';
      break;
    }
  }

  // --- 2. PRICE ---
  let price = 'N/A';
  const priceSelectors = ['#prcIsum', '.x-price-primary', '#mm-saleDscPrc'];
  for (const selector of priceSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      price = el.textContent?.trim() || 'N/A';
      break;
    }
  }

  // --- 3. DESCRIPTION ---
  // eBay often puts the description inside an iframe or a specific div
  let descriptionHtml = 'N/A';
  let description = 'N/A';
  
  // Try to find the description container
  const descEl = doc.querySelector('#ds_div') || doc.querySelector('.d-item-description');
  
  if (descEl) {
    descriptionHtml = descEl.innerHTML;
    description = descEl.textContent?.trim() || 'N/A';
  } else {
    // Fallback: Use the whole body if we really can't find the specific div (rare)
    // But usually better to return N/A than garbage
  }

  // --- 4. ITEM SPECIFICS ---
  const itemSpecifics: { name: string; value: string }[] = [];
  
  // eBay usually puts these in a table or list
  // Strategy A: The "Item specifics" section container
  const specLabels = doc.querySelectorAll('.ux-labels-values__labels');
  const specValues = doc.querySelectorAll('.ux-labels-values__values');

  if (specLabels.length > 0 && specLabels.length === specValues.length) {
    specLabels.forEach((labelEl, index) => {
      const name = labelEl.textContent?.replace(':', '').trim() || '';
      const value = specValues[index].textContent?.trim() || '';
      if (name && value) {
        itemSpecifics.push({ name, value });
      }
    });
  } else {
    // Strategy B: Old school tables (ItemSpecifics)
    const tableRows = doc.querySelectorAll('.item-specials-tbl tr');
    tableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      for (let i = 0; i < cells.length; i += 2) {
        const name = cells[i]?.textContent?.trim().replace(':', '');
        const value = cells[i + 1]?.textContent?.trim();
        if (name && value) {
          itemSpecifics.push({ name, value });
        }
      }
    });
  }

  // --- 5. NEW: ITEM ID ---
  let itemId = 'N/A';
  // Strategy A: Look for the standard ID element
  const itemIdEl = doc.querySelector('#descItemNumber');
  if (itemIdEl) {
    itemId = itemIdEl.textContent?.trim() || 'N/A';
  } else {
    // Strategy B: Regex search in the text (e.g. "Item number: 123456")
    const match = doc.body.textContent?.match(/Item number:?\s*(\d+)/i);
    if (match) {
      itemId = match[1];
    }
  }

  // --- 6. NEW: CATEGORY ---
  let category = 'N/A';
  // Strategy A: Breadcrumbs (The most reliable source)
  const breadcrumbs = doc.querySelectorAll('.seo-breadcrumb-text span, nav.breadcrumbs ul li a');
  if (breadcrumbs.length > 0) {
    // Get the last one that isn't the item title
    // Usually the last actual category is the second to last element in breadcrumbs
    const categories = Array.from(breadcrumbs).map(el => el.textContent?.trim()).filter(Boolean);
    // Join the last 2 categories for context (e.g. "Home > Bedding > Duvets")
    if (categories.length > 1) {
      category = categories.slice(-2).join(' > ');
    } else if (categories.length === 1) {
      category = categories[0] || 'N/A';
    }
  }

  return {
    title,
    price,
    description,
    descriptionHtml,
    itemSpecifics,
    itemId,   // NEW
    category  // NEW
  };
};
