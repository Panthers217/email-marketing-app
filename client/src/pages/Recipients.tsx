import React, { useEffect, useState } from 'react';
import { recipientsAPI } from '../api';

const Recipients: React.FC = () => {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkImportFormat, setBulkImportFormat] = useState<'simple' | 'csv'>('simple');
  const [bulkImportType, setBulkImportType] = useState<'church' | 'artist'>('church');
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    tags: '', 
    city: '', 
    county: '', 
    subject: '',
    type: 'church' as 'church' | 'artist',
    denomination: '',
    phone: '',
    street: '',
    state: '',
    zip: '',
    website: '',
    source_url: ''
  });
  const [bulkEmails, setBulkEmails] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRecipients();
  }, [search, searchField, typeFilter]);

  const loadRecipients = async () => {
    try {
      const response = await recipientsAPI.list({ search, searchField, type: typeFilter });
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
        name: formData.name || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        city: formData.city || null,
        county: formData.county || null,
        subject: formData.subject,
        type: formData.type,
        denomination: formData.denomination || null,
        phone: formData.phone || null,
        street: formData.street || null,
        state: formData.state || null,
        zip: formData.zip || null,
        website: formData.website || null,
        source_url: formData.source_url || null,
      });
      setMessage('Recipient added successfully!');
      setFormData({ 
        email: '', 
        name: '', 
        tags: '', 
        city: '', 
        county: '', 
        subject: '',
        type: 'church',
        denomination: '',
        phone: '',
        street: '',
        state: '',
        zip: '',
        website: '',
        source_url: ''
      });
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
        const response = await recipientsAPI.bulkCreate(emails, bulkImportType);
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

  const handleEditClick = (recipient: any) => {
    setEditingRecipient(recipient);
    setFormData({
      email: recipient.email || '',
      name: recipient.name || '',
      tags: recipient.tags?.join(', ') || '',
      city: recipient.city || '',
      county: recipient.county || '',
      subject: recipient.subject || '',
      type: recipient.type || 'church',
      denomination: recipient.denomination || '',
      phone: recipient.phone || '',
      street: recipient.street || '',
      state: recipient.state || '',
      zip: recipient.zip || '',
      website: recipient.website || '',
      source_url: recipient.source_url || '',
    });
    setShowEditForm(true);
    setMessage('');
  };

  const handleUpdateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipient) return;
    
    try {
      await recipientsAPI.update(editingRecipient._id, {
        email: formData.email,
        name: formData.name || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        city: formData.city || null,
        county: formData.county || null,
        subject: formData.subject,
        type: formData.type,
        denomination: formData.denomination || null,
        phone: formData.phone || null,
        street: formData.street || null,
        state: formData.state || null,
        zip: formData.zip || null,
        website: formData.website || null,
        source_url: formData.source_url || null,
      });
      setMessage('Recipient updated successfully!');
      setFormData({ 
        email: '', 
        name: '', 
        tags: '', 
        city: '', 
        county: '', 
        subject: '',
        type: 'church',
        denomination: '',
        phone: '',
        street: '',
        state: '',
        zip: '',
        website: '',
        source_url: ''
      });
      setShowEditForm(false);
      setEditingRecipient(null);
      await loadRecipients();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update recipient');
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

      {showEditForm && editingRecipient && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Edit Recipient</h2>
          <form onSubmit={handleUpdateRecipient} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'church' | 'artist' })}
              >
                <option value="church">Church</option>
                <option value="artist">Artist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Denomination</label>
              <input
                type="text"
                placeholder="Baptist, Methodist, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.denomination}
                onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                placeholder="(555) 123-4567"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input
                type="text"
                placeholder="123 Main St"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                placeholder="FL"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP</label>
              <input
                type="text"
                placeholder="12345"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source URL</label>
              <input
                type="url"
                placeholder="https://source.com/page"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Update Recipient
              </button>
              <button type="button" onClick={() => {
                setShowEditForm(false);
                setEditingRecipient(null);
                setFormData({ 
                  email: '', 
                  name: '', 
                  tags: '', 
                  city: '', 
                  county: '', 
                  subject: '',
                  type: 'church',
                  denomination: '',
                  phone: '',
                  street: '',
                  state: '',
                  zip: '',
                  website: '',
                  source_url: ''
                });
              }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'church' | 'artist' })}
              >
                <option value="church">Church</option>
                <option value="artist">Artist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Denomination</label>
              <input
                type="text"
                placeholder="Baptist, Methodist, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.denomination}
                onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                placeholder="(555) 123-4567"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input
                type="text"
                placeholder="123 Main St"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                placeholder="FL"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP</label>
              <input
                type="text"
                placeholder="12345"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source URL</label>
              <input
                type="url"
                placeholder="https://source.com/page"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
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
                    onChange={() => setBulkImportFormat('simple')}
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
                    onChange={() => setBulkImportFormat('csv')}
                    className="mr-2"
                  />
                  <span>CSV Format</span>
                </label>
              </div>
            </div>
            {bulkImportFormat === 'simple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type *</label>
                <select
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                  value={bulkImportType}
                  onChange={(e) => setBulkImportType(e.target.value as 'church' | 'artist')}
                >
                  <option value="church">Church</option>
                  <option value="artist">Artist</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {bulkImportFormat === 'simple' ? 'Email Addresses (one per line)' : 'CSV Data (email,name,city,county,tags,type,denomination,phone,street,state,zip,website,source_url)'}
              </label>              {bulkImportFormat === 'simple' && (
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Note: Subject will default to "General" for all imported recipients. Type is selected above.
                </p>
              )}              {bulkImportFormat === 'csv' && (
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Format: email,name,city,county,tags,type,denomination,phone,street,state,zip,website,source_url<br />
                  Example: user@example.com,John Doe,New York,Duval County,&quot;customer,vip&quot;,church,Baptist,555-1234,123 Main St,FL,12345,https://example.com,https://source.com<br />
                  Note: Subject will default to &quot;General&quot; for all imported recipients. Type must be either &quot;church&quot; or &quot;artist&quot; (defaults to church if invalid/empty).
                </p>
              )}
              <textarea
                rows={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder={
                  bulkImportFormat === 'simple'
                    ? 'user1@example.com\nuser2@example.com\nuser3@example.com'
                    : 'user1@example.com,John Doe,New York,Duval County,"customer,vip",church,Baptist,555-1234,123 Main St,FL,12345,https://example.com,https://source.com\nuser2@example.com,Jane Smith,Boston,Suffolk County,customer,artist,Methodist,555-5678,456 Oak Ave,MA,67890,,'
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
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search recipients..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="all">All Fields</option>
              <option value="email">Email</option>
              <option value="name">Name</option>
              <option value="subject">Subject</option>
              <option value="city">City</option>
              <option value="county">County</option>
              <option value="state">State</option>
              <option value="zip">ZIP</option>
              <option value="denomination">Denomination</option>
              <option value="phone">Phone</option>
              <option value="street">Street</option>
            </select>
          </div>
          <div className="w-40">
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="church">Church</option>
              <option value="artist">Artist</option>
            </select>
          </div>
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
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Street</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">ZIP</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">County</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Denomination</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Website</th>  
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Source URL</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipient.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.subject || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${recipient.type === 'church' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {recipient.type || 'church'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.tags?.length > 0 ? recipient.tags.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.street || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.city || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.state || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.zip || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.county || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.denomination || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.website ? (
                        <a href={recipient.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {recipient.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.source_url ? (
                        <a href={recipient.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {recipient.source_url}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.time || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.date ? new Date(recipient.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.createdAt ? new Date(recipient.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(recipient)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(recipient._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
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
