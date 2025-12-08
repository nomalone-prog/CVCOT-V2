
import React, { useState, useCallback } from 'react';
import { UploadForm } from './components/UploadForm';
import { AuditDashboard } from './components/AuditDashboard';
import { ParsedListingData, AuditReport, Status } from './types';
import { auditListing } from './services/geminiService';
import { parseeBayListingHTML } from './utils/htmlParser';

const App: React.FC = () => {
  const [parsedData, setParsedData] = useState<ParsedListingData | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [status, setStatus] = useState<Status>('idle'); // idle, loading, success, error
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (fileContent: string) => {
    setStatus('loading');
    setError(null);
    setAuditReport(null); // Clear previous report

    try {
      const data = parseeBayListingHTML(fileContent);
      setParsedData(data);

      // Fix: Changed 'data.description' to 'data.descriptionHtml'
      // Updated error message to be more specific
      if (data.title === 'N/A' || data.descriptionHtml === 'N/A' || data.itemSpecifics.length === 0) {
        throw new Error("Could not extract essential listing data (title, description, or item specifics) from the HTML file. Please ensure it's a valid eBay listing 'Webpage, Complete' file.");
      }

      const report = await auditListing(data);
      setAuditReport(report);
      setStatus('success');
    } catch (e: any) {
      console.error("Audit failed:", e);
      setError(e.message || "An unknown error occurred during the audit process.");
      setStatus('error');
    }
  }, []);

  const resetAudit = useCallback(() => {
    setParsedData(null);
    setAuditReport(null);
    setStatus('idle');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-primary-bg font-sans">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-accent leading-tight">
          CVC Listing Optimisation Tool
        </h1>
        <p className="text-xl text-text-light mt-2 max-w-2xl">
          Automated, AI-driven critique for your eBay listings. Maximize SEO and conversion rates.
        </p>
      </header>

      {status === 'idle' && (
        <UploadForm onFileUpload={handleFileUpload} />
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center p-8 bg-secondary-bg rounded-lg shadow-xl text-text-light">
          <svg className="animate-spin h-10 w-10 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Analyzing your listing with Gemini...</p>
          <p className="text-text-dark text-sm mt-1">This may take a moment.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center p-8 bg-red-status/20 rounded-lg shadow-xl text-red-status border border-red-status">
          <p className="text-xl font-bold mb-2">Audit Failed!</p>
          <p className="text-lg">{error || "Please try again or check your HTML file."}</p>
          <button
            onClick={resetAudit}
            className="mt-6 px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg"
          >
            Try Another Listing
          </button>
        </div>
      )}

      {status === 'success' && auditReport && parsedData && (
        <div className="w-full max-w-7xl">
          <AuditDashboard parsedData={parsedData} auditReport={auditReport} />
          <div className="text-center mt-10">
            <button
              onClick={resetAudit}
              className="px-8 py-4 bg-accent text-white font-bold text-lg rounded-full hover:bg-accent-dark transition-colors shadow-xl"
            >
              Start New Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;