'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import PrimaryButton from '../common-components/primary-button';



function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}


const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Define the props for our reusable component
interface ReportDownloaderProps {
  title: string;
  apiEndpoint: string;
  fileNamePrefix: string;
  showDateSelectors?: boolean; // Optional: show date selectors, default to true
}

const ReportDownloader = ({ 
  title, 
  apiEndpoint, 
  fileNamePrefix, 
  showDateSelectors = true 
}: ReportDownloaderProps) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);
  const day = String(currentDate.getDate()).padStart(2, "0");

  const handleDownload = async () => {
    setIsLoading(true);
    const token = getAuthToken();

    if (!token) {
      toast.error("Authentication error. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Build the URL dynamically based on props
      let url = `http://localhost:5000/api${apiEndpoint}`;
      if (showDateSelectors) {
        
        url += `?year=${year}&month=${month}&day=${day}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // 2. Build the filename dynamically based on props
      let filename = `${fileNamePrefix}.csv`;
      if (showDateSelectors) {
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        filename = `${fileNamePrefix}-${day}-${monthName}-${year}.csv`;
      }
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Report download started!");

    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        
        {/* 3. Conditionally render the date selectors */}
        {showDateSelectors && (
          <>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full sm:w-auto p-2 border rounded-md"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full sm:w-auto p-2 border rounded-md"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        
        <PrimaryButton
          context={isLoading ? 'Generating...' : 'Download CSV'}
          icon={Download}
          onClick={handleDownload}
          disabled={isLoading}
          className={`!h-10 !w-full sm:!w-auto ${isLoading ? 'opacity-50' : ''}`}
        />
      </div>
    </div>
  );
};

export default ReportDownloader;