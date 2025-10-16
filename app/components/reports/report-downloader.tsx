'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import PrimaryButton from '../common-components/primary-button';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const ReportDownloader = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    const token = getAuthToken();

    if (!token) {
      toast.error("Authentication error. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reports/monthly-orders?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      // MODIFIED: Change the file extension to .csv
      link.setAttribute('download', `Order-Report-${monthName}-${year}.csv`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Report download started!");

    } catch (error: any) {
      toast.error(error.message);
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
      <h3 className="text-lg font-semibold mb-4">Download Monthly Report</h3>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
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
        
        <PrimaryButton
          // MODIFIED: Update button text
          context={isLoading ? 'Generating...' : 'Download CSV'}
          icon={Download}
          onClick={handleDownload}
          className={`!h-10 !w-full sm:!w-auto ${isLoading ? 'opacity-50' : ''}`}
        />
      </div>
    </div>
  );
};

export default ReportDownloader;