import React, { useEffect, useState } from 'react';
import { recipientsAPI } from '../api';

const Recipients: React.FC = () => {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkImportFormat, setBulkImportFormat] = useState<'simple' | 'csv'>('simple');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ email: '', name: '', tags: '', city: '', county: '', subject: '' });
  const [bulkEmails, setBulkEmails] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRecipients();
  }, [search]);

  const loadRecipients = async () => {
    try {
      const response = await recipientsAPI.list({ search });
      setRecipients(response.data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recipientsAPI.create({
        email: formData.email,
        name: formData.name || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        city: formData.city || undefined,
        county: formData.county || undefined,
        subject: formData.subject,
      });
      setMessage('Recipient added successfully!');
      setFormData({ email: '', name: '', tags: '', city: '', county: '', subject: '' });
      setShowAddForm(false);
      await loadRecipients();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to add recipient');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (bulkImportFormat === 'simple') {
        const emails = bulkEmails
          .split('\n')
          .map(e => e.trim())
          .filter(e => e);
        const response = await recipientsAPI.bulkCreate(emails);
        setMessage(`Bulk import successful! Added ${response.data.inserted} recipients.`);
      } else {
        // CSV format
        const response = await recipientsAPI.bulkCreateCSV(bulkEmails);
        setMessage(`CSV import successful! Added ${response.data.inserted} recipients.`);
      }
      setBulkEmails('');
      setShowBulkForm(false);
      await loadRecipients();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to import recipients');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) return;
    try {
      await recipientsAPI.delete(id);
      await loadRecipients();
    } catch (error) {
      console.error('Failed to delete recipient:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recipients</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Single
          </button>
          <button
            onClick={() => setShowBulkForm(!showBulkForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Bulk Import
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Add Recipient</h2>
          <form onSubmit={handleAddRecipient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="customer, vip"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                placeholder="New York"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">County</label>
              <input
                type="text"
                placeholder="Duval County"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject *</label>
              <input
                type="text"
                required
                placeholder="Newsletter subscription"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Add Recipient
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showBulkForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Bulk Import Recipients</h2>
          <form onSubmit={handleBulkImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Import Format</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="simple"
                    checked={bulkImportFormat === 'simple'}
                    onChange={(e) => setBulkImportFormat('simple')}
                    className="mr-2"
                  />
                  <span>Email List</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={bulkImportFormat === 'csv'}
                    onChange={(e) => setBulkImportFormat('csv')}
                    className="mr-2"
                  />
                  <span>CSV Format</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {bulkImportFormat === 'simple' ? 'Email Addresses (one per line)' : 'CSV Data (email,name,city,county,tags)'}
              </label>              {bulkImportFormat === 'simple' && (
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Note: Subject will default to "General" for all imported recipients
                </p>
              )}              {bulkImportFormat === 'csv' && (
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Format: email,name,city,county,tags<br />
                  Example: user@example.com,John Doe,New York,Duval County,&quot;customer,vip&quot;<br />
                  Note: Subject will default to &quot;General&quot; for all imported recipients
                </p>
              )}
              <textarea
                rows={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder={
                  bulkImportFormat === 'simple'
                    ? 'user1@example.com\nuser2@example.com\nuser3@example.com'
                    : 'user1@example.com,John Doe,New York,Duval County,"customer,vip"\nuser2@example.com,Jane Smith,Boston,Suffolk County,customer'
                }
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Import
              </button>
              <button type="button" onClick={() => setShowBulkForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search recipients..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recipients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">County</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipient.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.city || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.county || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.subject || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.tags?.length > 0 ? recipient.tags.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(recipient._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipients;
