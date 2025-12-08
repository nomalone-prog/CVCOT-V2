import React, { useState, useCallback } from 'react';
import { ParsedListingData, AuditReport } from '../types';
import { CircularProgressRing } from './CircularProgressRing';
import { generateEmailContent } from '../utils/emailHelpers';
import { generateCsvContent } from '../utils/csvHelpers';

interface AuditDashboardProps {
  parsedData: ParsedListingData;
  auditReport: AuditReport;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ parsedData, auditReport }) => {
  const [copyStatusTitle, setCopyStatusTitle] = useState<'idle' | 'copied'>('idle');
  const [copyStatusEmail, setCopyStatusEmail] = useState<'idle' | 'copied'>('idle');
  const [copyStatusHive, setCopyStatusHive] = useState<'idle' | 'copied'>('idle');

  const handleCopyToClipboard = useCallback(async (text: string, type: 'title' | 'email' | 'hive') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'title') {
        setCopyStatusTitle('copied');
        setTimeout(() => setCopyStatusTitle('idle'), 2000);
      } else if (type === 'email') {
        setCopyStatusEmail('copied');
        setTimeout(() => setCopyStatusEmail('idle'), 2000);
      } else {
        setCopyStatusHive('copied');
        setTimeout(() => setCopyStatusHive('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy. Please try manually.');
    }
  }, []);

  const handleDownloadCsv = useCallback(() => {
    try {
      const csvContent = generateCsvContent(parsedData, auditReport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const sanitizedTitle = parsedData.title.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 50) || 'report';
        
      link.setAttribute('href', url);
      link.setAttribute('download', `cvc_listing_audit_${sanitizedTitle}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate or download CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  }, [parsedData, auditReport]);

  const renderRichText = (htmlString: string) => {
    return { __html: htmlString };
  };

  // --- GRADING LOGIC ---
  let scoreLabel = '';
  let scoreColorClass = '';
  let ringColor = '';

  const score = auditReport.overallScore;

  if (score > 75) {
      scoreLabel = 'Excellent';
      scoreColorClass = 'text-green-status'; 
      ringColor = '#10B981'; 
  } else if (score > 50) {
      scoreLabel = 'Good';
      scoreColorClass = 'text-yellow-400'; 
      ringColor = '#FBBF24'; 
  } else {
      scoreLabel = 'Needs Work';
      scoreColorClass = 'text-red-status'; 
      ringColor = '#EF4444'; 
  }

  const { subject: emailSubject, body: emailBody } = generateEmailContent(parsedData, auditReport);
  const fullEmailContent = `Subject: ${emailSubject}\n\n${emailBody}`;

  const hiveText = `emailed seller regarding ${parsedData.itemId} Advised listing needs better optimisation and gave optimisation details including title, item specifics, description and photos.`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8 rounded-xl bg-secondary-bg shadow-2xl">
      
      {/* General Info Header Box */}
      <div className="lg:col-span-3 p-4 bg-gray-800 rounded-xl border border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-4">
         {/* Column 1: Item ID */}
         <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Item ID</h3>
            <p className="text-white text-base font-mono truncate" title={parsedData.itemId}>{parsedData.itemId}</p>
         </div>
         
         {/* Column 2: Seller */}
         <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Seller</h3>
            <p className="text-white text-base font-medium truncate">{parsedData.sellerName}</p>
            <p className="text-text-dark text-xs">{parsedData.feedbackScore} Feedback</p>
         </div>

         {/* Column 3: Category */}
         <div className="md:col-span-1">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Category</h3>
            <p className="text-white text-base font-medium truncate" title={parsedData.category}>
               {parsedData.category.split('>').pop()?.trim() || parsedData.category}
            </p>
         </div>

         {/* Column 4: Condition & Price */}
         <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Details</h3>
            <p className="text-white text-base">{parsedData.condition}</p>
            <p className="text-green-status font-bold">{parsedData.price}</p>
         </div>

         {/* Column 5: Image Health (Smart Variation Logic) */}
         <div>
             <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Photos</h3>
             {parsedData.isVariation ? (
                 <div>
                    <span className="text-white text-lg font-bold">{parsedData.imageCount}+</span>
                    <span className="block text-[10px] text-accent font-bold uppercase tracking-wide">VARIATION LISTING</span>
                 </div>
             ) : (
                 <div>
                     <div className="flex items-center">
                         <span className={`text-xl font-bold ${parsedData.imageCount >= 6 ? 'text-green-status' : 'text-red-status'}`}>
                            {parsedData.imageCount}
                         </span>
                         <span className="text-gray-500 text-xs ml-1">/ 24</span>
                     </div>
                     {parsedData.imageCount < 6 && <span className="text-red-status text-[10px] font-bold">LOW COUNT</span>}
                 </div>
             )}
         </div>
      </div>

      {/* LEFT COL: Overall Score & Download */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="p-4 bg-primary-bg rounded-xl shadow-inner flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-text-light mb-4">Listing Health</h2>
          <div className="relative flex items-center justify-center w-40 h-40">
            <CircularProgressRing percentage={score} radius={80} strokeWidth={8} color={ringColor} />
            <span className={`absolute text-xl font-extrabold text-center px-2 leading-tight ${scoreColorClass}`}>{scoreLabel}</span>
          </div>
        </div>

        <div className="p-4 bg-primary-bg rounded-xl shadow-inner flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-text-light mb-4">Download Audit</h2>
          <button onClick={handleDownloadCsv} className="px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg flex items-center justify-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l3-3m-3 3l-3-3m2-8h7a2 2 0 012 2v8a2 2 0 01-2 2h-7m-4 0H5a2 2 0 01-2-2v-8a2 2 0 012-2h7a2 2 0 012 2v4"></path></svg>
            Download as CSV
          </button>
        </div>
      </div>

      {/* RIGHT COL: Title Strategy */}
      <div className="lg:col-span-2 p-6 bg-primary-bg rounded-xl shadow-inner">
        <h2 className="text-3xl font-bold text-text-light mb-4">Title Strategy</h2>
        <div className="space-y-4">
          <div>
            <p className="text-text-dark text-sm mb-1">Current Title:</p>
            <p className="text-red-status font-bold text-lg p-2 bg-gray-800 rounded">{parsedData.title}</p>
          </div>
          <div>
            <p className="text-text-dark text-sm mb-1 flex items-center justify-between">
              Recommended Title:
              <button onClick={() => handleCopyToClipboard(auditReport.titleStrategy.recommendedTitle, 'title')} className="ml-2 px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-dark transition-colors flex items-center">
                {copyStatusTitle === 'copied' ? <>Copied!</> : <>Copy</>}
              </button>
            </p>
            <p className="text-green-status font-bold text-xl p-2 bg-gray-800 rounded">{auditReport.titleStrategy.recommendedTitle}</p>
            <div className="mt-4 p-3 bg-gray-800/50 border-l-4 border-accent rounded-r">
              <p className="text-text-light text-sm italic">
                <span className="font-bold text-accent not-italic">AI Reasoning: </span>
                {auditReport.titleStrategy.reasoning}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: eBay Advertising */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <h2 className="text-3xl font-bold text-text-light mb-4">eBay Advertising</h2>
        <div className="flex-grow space-y-6">
          <div>
            <p className="text-xl font-semibold text-accent mb-2">Recommended Campaign Type:</p>
            <p className="text-2xl font-bold text-emerald-300">{auditReport.ebayAdvertising.recommendedCampaignType}</p>
          </div>
          <p className="text-text-light leading-relaxed">{auditReport.ebayAdvertising.campaignInfo}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-text-light mb-2">Exact Match Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {auditReport.ebayAdvertising.exactMatchKeywords.map((keyword, index) => (
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">{keyword}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-text-light mb-2">Phrase Match Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {auditReport.ebayAdvertising.phraseMatchKeywords.map((keyword, index) => (
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">{keyword}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-text-light mb-2">Broad Match Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {auditReport.ebayAdvertising.broadMatchKeywords.map((keyword, index) => (
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">{keyword}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-2xl font-bold text-text-light mb-3">How to set up your campaign:</h3>
            <ol className="list-decimal list-inside text-text-light space-y-2 text-lg">
              {auditReport.ebayAdvertising.setupInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* === SPLIT SECTION: Item Specs (Left) / Photos & Desc (Right) === */}
      <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ITEM SPECIFICS (Left Column) */}
          <div className="lg:col-span-1 p-6 bg-primary-bg rounded-xl shadow-inner h-full">
            <h2 className="text-3xl font-bold text-text-light mb-4">Item Specifics</h2>
            <div className="mb-4 p-3 bg-gray-800/50 border-l-4 border-accent rounded-r">
                <p className="text-text-light text-sm italic">{auditReport.itemSpecificsRecommendations.reasoning}</p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-text-light mb-2">Recommended Additions:</h3>
                {auditReport.itemSpecificsRecommendations.additions.length > 0 ? (
                  <ul className="list-disc list-inside text-text-light space-y-1">
                    {auditReport.itemSpecificsRecommendations.additions.map((spec, index) => (
                      <li key={`add-${index}`} className="text-lg"><span className="text-emerald-300 font-medium">{spec}</span></li>
                    ))}
                  </ul>
                ) : <p className="text-text-dark">No additions recommended.</p>}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-light mb-2">Recommended Corrections:</h3>
                {auditReport.itemSpecificsRecommendations.corrections.length > 0 ? (
                  <ul className="list-disc list-inside text-text-light space-y-2">
                    {auditReport.itemSpecificsRecommendations.corrections.map((corr, index) => (
                      <li key={`corr-${index}`} className="text-lg">
                        <p><span className="font-semibold">{corr.label}:</span></p>
                        <p className="ml-4 text-text-dark">Current: <span className="text-red-status">{corr.current_value}</span></p>
                        <p className="ml-4">Recommended: <span className="text-green-status">{corr.recommended_value}</span></p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-text-dark">No corrections recommended.</p>}
              </div>
            </div>
          </div>

          {/* PHOTOS & DESCRIPTION (Right Column Wrapper) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Photo Recommendations */}
              <div className="p-6 bg-primary-bg rounded-xl shadow-inner">
                <h2 className="text-3xl font-bold text-text-light mb-4">Photo Recommendations</h2>
                <div className="prose prose-invert max-w-none text-text-light text-lg leading-relaxed">
                  <div dangerouslySetInnerHTML={renderRichText(auditReport.photoAdvice)} />
                </div>
              </div>

              {/* Description Rewrite */}
              <div className="p-6 bg-primary-bg rounded-xl shadow-inner flex-grow">
                <h2 className="text-3xl font-bold text-text-light mb-4">Description Rewrite</h2>
                <div className="mb-4 p-3 bg-gray-800/50 border-l-4 border-accent rounded-r">
                    <p className="text-text-light text-sm italic"><span className="font-bold text-accent not-italic">Strategy: </span>{auditReport.descriptionChangeReasoning}</p>
                </div>
                <div className="prose prose-invert max-w-none text-text-light text-lg leading-relaxed">
                  <div dangerouslySetInnerHTML={renderRichText(auditReport.descriptionRewrite)} />
                </div>
              </div>
          </div>
      </div>
      {/* === END SPLIT SECTION === */}


      {/* Email to Seller */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-text-light">Email to Seller</h2>
          <button onClick={() => handleCopyToClipboard(fullEmailContent, 'email')} className="ml-4 px-4 py-2 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg flex items-center">
            {copyStatusEmail === 'copied' ? <>Copied!</> : <>Copy Email</>}
          </button>
        </div>
        <div className="flex-grow p-6 bg-gray-800 rounded-lg text-text-light whitespace-pre-wrap font-mono text-sm leading-relaxed">
          <p className="font-bold mb-2">Subject: {emailSubject}</p>
          <hr className="border-gray-700 my-4" />
          {emailBody}
        </div>
      </div>

      {/* Copy for Hive */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-text-light">Copy for Hive</h2>
          <button onClick={() => handleCopyToClipboard(hiveText, 'hive')} className="ml-4 px-4 py-2 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg flex items-center">
            {copyStatusHive === 'copied' ? <>Copied!</> : <>Copy Text</>}
          </button>
        </div>
        <div className="flex-grow p-6 bg-gray-800 rounded-lg text-text-light whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {hiveText}
        </div>
      </div>

      {/* Logistics (Moved to Bottom) */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <h2 className="text-3xl font-bold text-text-light mb-4">Logistics</h2>
        <div className="flex-grow space-y-4">
          <div>
            <p className="text-text-dark text-sm mb-1">Postage Policy:</p>
            <p className="text-text-light text-lg p-2 bg-gray-800 rounded">{auditReport.logistics.postagePolicy}</p>
          </div>
          <div>
            <p className="text-text-dark text-sm mb-1">Return Policy:</p>
            <p className="text-text-light text-lg p-2 bg-gray-800 rounded">{auditReport.logistics.returnPolicy}</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
          <p className="text-lg text-text-dark italic">
            "Ensuring competitive shipping rates and clear return policies can significantly boost buyer confidence."
          </p>
        </div>
      </div>

    </div>
  );
};
