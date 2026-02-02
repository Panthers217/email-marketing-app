import React, { useEffect, useState } from 'react';
import { recipientsAPI } from '../api';

interface Recipient {
  _id: string;
  email: string;
  name?: string;
  city?: string;
  county?: string;
  website?: string;
  type: 'church' | 'artist';
}

const DownloadMailingList: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'church' | 'artist'>('all');

  useEffect(() => {
    loadRecipients();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredRecipients(recipients);
    } else {
      setFilteredRecipients(recipients.filter(r => r.type === filter));
    }
  }, [filter, recipients]);

  const loadRecipients = async () => {
    try {
      const response = await recipientsAPI.list();
      setRecipients(response.data);
      setFilteredRecipients(response.data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  };

  const getFilterLabel = () => {
    if (filter === 'church') return 'Church';
    if (filter === 'artist') return 'Artist';
    return 'All Recipients';
  };

  const generateTextContent = () => {
    const header = `${getFilterLabel()} Mailing List`;
    const date = getCurrentDate();
    let content = `${header}\n${date}\n\n`;

    filteredRecipients.forEach((recipient, index) => {
      content += `${index + 1}. ${recipient.name || 'N/A'}\n`;
      content += `   Email: ${recipient.email}\n`;
      content += `   City: ${recipient.city || 'N/A'}\n`;
      content += `   County: ${recipient.county || 'N/A'}\n`;
      content += `   Website: ${recipient.website || 'N/A'}\n\n`;
    });

    return content;
  };

  const downloadAsText = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getFilterLabel().toLowerCase().replace(' ', '_')}_mailing_list_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async () => {
    try {
      // Using jsPDF library for PDF generation
      // First, we need to dynamically import it
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const header = `${getFilterLabel()} Mailing List`;
      const date = getCurrentDate();

      // Add header
      doc.setFontSize(16);
      doc.text(header, 20, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.text(date, 20, 30);

      // Add recipients
      doc.setFontSize(10);
      let yPosition = 45;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;

      filteredRecipients.forEach((recipient, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${recipient.name || 'N/A'}`, 20, yPosition);
        yPosition += lineHeight;

        doc.setFont('helvetica', 'normal');
        doc.text(`   Email: ${recipient.email}`, 20, yPosition);
        yPosition += lineHeight;

        doc.text(`   City: ${recipient.city || 'N/A'}`, 20, yPosition);
        yPosition += lineHeight;

        doc.text(`   County: ${recipient.county || 'N/A'}`, 20, yPosition);
        yPosition += lineHeight;

        doc.text(`   Website: ${recipient.website || 'N/A'}`, 20, yPosition);
        yPosition += lineHeight + 3; // Extra spacing between entries
      });

      doc.save(`${getFilterLabel().toLowerCase().replace(' ', '_')}_mailing_list_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please make sure jsPDF is installed.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading mailing list...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Download Mailing List</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadAsText}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            disabled={filteredRecipients.length === 0}
          >
            Download as Text
          </button>
          <button
            onClick={downloadAsPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
            disabled={filteredRecipients.length === 0}
          >
            Download as PDF
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Recipients ({recipients.length})
          </button>
          <button
            onClick={() => setFilter('church')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'church'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Church ({recipients.filter(r => r.type === 'church').length})
          </button>
          <button
            onClick={() => setFilter('artist')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'artist'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Artist ({recipients.filter(r => r.type === 'artist').length})
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3">
          <h3 className="text-lg font-medium text-gray-900">{getFilterLabel()} Mailing List</h3>
          <p className="text-sm text-gray-500">{getCurrentDate()}</p>
        </div>

        {filteredRecipients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recipients found for the selected filter
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <ol className="list-decimal list-inside space-y-3">
              {filteredRecipients.map((recipient) => (
                <li key={recipient._id} className="text-sm">
                  <div className="inline-block ml-2">
                    <div className="font-medium text-gray-900">{recipient.name || 'N/A'}</div>
                    <div className="text-gray-600 ml-4">
                      <div>Email: {recipient.email}</div>
                      <div>City: {recipient.city || 'N/A'}</div>
                      <div>County: {recipient.county || 'N/A'}</div>
                      <div>Website: {recipient.website || 'N/A'}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadMailingList;
