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

  const handleCopyToClipboard = useCallback(async (text: string, type: 'title' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'title') {
        setCopyStatusTitle('copied');
        setTimeout(() => setCopyStatusTitle('idle'), 2000);
      } else {
        setCopyStatusEmail('copied');
        setTimeout(() => setCopyStatusEmail('idle'), 2000);
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
      if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        // Fix: Use a sanitized version of the title for the filename, as `itemId` does not exist on `ParsedListingData`.
        const sanitizedTitle = parsedData.title.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 50) || 'report';
        link.setAttribute('href', url);
        link.setAttribute('download', `cvc_listing_audit_${sanitizedTitle}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to generate or download CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  }, [parsedData, auditReport]);

  const renderRichText = (htmlString: string) => {
    return { __html: htmlString };
  };

  const isExcellentScore = auditReport.overallScore > 80;
  const scoreColorClass = isExcellentScore ? 'text-green-status' : 'text-accent';
  const scoreText = isExcellentScore ? 'Excellent!' : '';

  const { subject: emailSubject, body: emailBody } = generateEmailContent(parsedData, auditReport);
  const fullEmailContent = `Subject: ${emailSubject}\n\n${emailBody}`;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8 rounded-xl bg-secondary-bg shadow-2xl">
      {/* Container for Overall Score and Download CSV */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* Overall Score */}
        <div className="p-4 bg-primary-bg rounded-xl shadow-inner flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-text-light mb-2">Overall Score</h2>
          <div className="relative flex items-center justify-center w-32 h-32">
            <CircularProgressRing
              percentage={auditReport.overallScore}
              radius={50}
              strokeWidth={8}
              color={isExcellentScore ? 'var(--accent-dark)' : 'var(--accent)'}
            />
            <span className={`absolute text-4xl font-extrabold ${scoreColorClass}`}>
              {Math.round(auditReport.overallScore)}
            </span>
          </div>
          <p className={`mt-2 text-lg font-semibold ${scoreColorClass}`}>
            {scoreText}
          </p>
        </div>

        {/* Download Audit as CSV Button */}
        <div className="p-4 bg-primary-bg rounded-xl shadow-inner flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-text-light mb-4">Download Audit</h2>
          <button
            onClick={handleDownloadCsv}
            className="px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l3-3m-3 3l-3-3m2-8h7a2 2 0 012 2v8a2 2 0 01-2 2h-7m-4 0H5a2 2 0 01-2-2v-8a2 2 0 012-2h7a2 2 0 012 2v4"></path></svg>
            Download as CSV
          </button>
        </div>
      </div>

      {/* Title Strategy */}
      <div className="lg:col-span-2 p-6 bg-primary-bg rounded-xl shadow-inner">
        <h2 className="text-3xl font-bold text-text-light mb-4">Title Strategy</h2>
        <div className="space-y-4">
          <div>
            <p className="text-text-dark text-sm mb-1">Current Title ({auditReport.titleStrategy.score}% Score):</p>
            <p className="text-red-status font-bold text-lg p-2 bg-gray-800 rounded">{parsedData.title}</p>
          </div>
          <div>
            <p className="text-text-dark text-sm mb-1 flex items-center justify-between">
              Recommended Title:
              <button
                onClick={() => handleCopyToClipboard(auditReport.titleStrategy.recommendedTitle, 'title')}
                className="ml-2 px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-dark transition-colors flex items-center"
              >
                {copyStatusTitle === 'copied' ? (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    Copy
                  </>
                )}
              </button>
            </p>
            <p className="text-green-status font-bold text-xl p-2 bg-gray-800 rounded">{auditReport.titleStrategy.recommendedTitle}</p>
            <p className="mt-2 text-text-dark text-base leading-relaxed">
              This optimized title, '{auditReport.titleStrategy.recommendedTitle}', improves your eBay.co.uk SEO by strategically enhancing keyword prominence compared to your current title, '{parsedData.title}'. It prioritizes distinguishing product attributes and core features earlier in the title, which is crucial for capturing specific buyer searches. This approach maximizes the use of available character limits and aligns with eBay's search algorithms to significantly boost your listing's visibility and click-through rates by directly targeting what buyers are actively seeking.
            </p>
          </div>
        </div>
      </div>

      {/* eBay Advertising */}
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
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-text-light mb-2">Phrase Match Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {auditReport.ebayAdvertising.phraseMatchKeywords.map((keyword, index) => (
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-text-light mb-2">Broad Match Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {auditReport.ebayAdvertising.broadMatchKeywords.map((keyword, index) => (
                  <span key={index} className="bg-emerald-800 text-white px-3 py-1 rounded-full">
                    {keyword}
                  </span>
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


      {/* Item Specifics */}
      <div className="lg:col-span-1 p-6 bg-primary-bg rounded-xl shadow-inner">
        <h2 className="text-3xl font-bold text-text-light mb-4">Item Specifics</h2>
        <div className="space-y-6">
          {/* Recommended Additions */}
          <div>
            <h3 className="text-xl font-semibold text-text-light mb-2">Recommended Additions:</h3>
            {auditReport.itemSpecificsRecommendations.additions.length > 0 ? (
              <ul className="list-disc list-inside text-text-light space-y-1">
                {auditReport.itemSpecificsRecommendations.additions.map((spec, index) => (
                  <li key={`add-${index}`} className="text-lg">
                    <span className="text-emerald-300 font-medium">{spec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-dark">No additions recommended at this time.</p>
            )}
          </div>

          {/* Recommended Corrections */}
          <div>
            <h3 className="text-xl font-semibold text-text-light mb-2">Recommended Corrections:</h3>
            {auditReport.itemSpecificsRecommendations.corrections.length > 0 ? (
              <ul className="list-disc list-inside text-text-light space-y-2">
                {auditReport.itemSpecificsRecommendations.corrections.map((correction, index) => (
                  <li key={`corr-${index}`} className="text-lg">
                    <p><span className="font-semibold">{correction.label}:</span></p>
                    <p className="ml-4 text-text-dark">Current: <span className="text-red-status">{correction.current_value}</span></p>
                    <p className="ml-4">Recommended: <span className="text-green-status">{correction.recommended_value}</span></p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-dark">No corrections recommended at this time.</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Recommendations */}
      <div className="lg:col-span-2 p-6 bg-primary-bg rounded-xl shadow-inner">
        <h2 className="text-3xl font-bold text-text-light mb-4">Photo Recommendations</h2>
        {/* Render AI's generated HTML directly, which now includes the H2 heading and blueprint */}
        <div className="prose prose-invert max-w-none text-text-light text-lg leading-relaxed">
          <div dangerouslySetInnerHTML={renderRichText(auditReport.photoAdvice)} />
        </div>
      </div>

      {/* Description Rewrite */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner">
        <h2 className="text-3xl font-bold text-text-light mb-4">Description Rewrite</h2>
        <div className="prose prose-invert max-w-none text-text-light text-lg leading-relaxed">
          <div dangerouslySetInnerHTML={renderRichText(auditReport.descriptionRewrite)} />
        </div>
      </div>

      {/* Logistics */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <h2 className="text-3xl font-bold text-text-light mb-4">Logistics ({auditReport.logistics.score}% Score)</h2>
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

      {/* Email to Seller */}
      <div className="lg:col-span-3 p-6 bg-primary-bg rounded-xl shadow-inner flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-text-light">Email to Seller</h2>
          <button
            onClick={() => handleCopyToClipboard(fullEmailContent, 'email')}
            className="ml-4 px-4 py-2 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg flex items-center"
          >
            {copyStatusEmail === 'copied' ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Copy Email
              </>
            )}
          </button>
        </div>
        <div className="flex-grow p-6 bg-gray-800 rounded-lg text-text-light whitespace-pre-wrap font-mono text-sm leading-relaxed">
          <p className="font-bold mb-2">Subject: {emailSubject}</p>
          <hr className="border-gray-700 my-4" />
          {emailBody}
        </div>
      </div>
    </div>
  );
};