import React, { useEffect, useState, useRef } from 'react';
import { recipientsAPI } from '../api';

const Recipients: React.FC = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  const [visibleColumns, setVisibleColumns] = useState({
    email: true,
    name: true,
    subject: true,
    type: true,
    tags: true,
    phone: true,
    street: true,
    city: true,
    state: true,
    zip: true,
    county: true,
    denomination: true,
    website: true,
    source_url: true,
    time: true,
    date: true,
    createdAt: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };

    if (showColumnDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown]);

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

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const selectAllColumns = () => {
    const allSelected = Object.fromEntries(
      Object.keys(visibleColumns).map(key => [key, true])
    ) as typeof visibleColumns;
    setVisibleColumns(allSelected);
  };

  const deselectAllColumns = () => {
    const allDeselected = Object.fromEntries(
      Object.keys(visibleColumns).map(key => [key, false])
    ) as typeof visibleColumns;
    setVisibleColumns(allDeselected);
  };

  const columnLabels = {
    email: 'Email',
    name: 'Name',
    subject: 'Subject',
    type: 'Type',
    tags: 'Tags',
    phone: 'Phone',
    street: 'Street',
    city: 'City',
    state: 'State',
    zip: 'ZIP',
    county: 'County',
    denomination: 'Denomination',
    website: 'Website',
    source_url: 'Source URL',
    time: 'Time',
    date: 'Date',
    createdAt: 'Created At',
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
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              Show/Hide Columns
              <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showColumnDropdown && (
              <div className="origin-top-left absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllColumns}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={deselectAllColumns}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                  {Object.entries(columnLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={() => toggleColumnVisibility(key as keyof typeof visibleColumns)}
                        className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                  {visibleColumns.email && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Email</th>}
                  {visibleColumns.name && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>}
                  {visibleColumns.subject && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>}
                  {visibleColumns.type && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Type</th>}
                  {visibleColumns.tags && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>}
                  {visibleColumns.phone && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>}
                  {visibleColumns.street && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Street</th>}
                  {visibleColumns.city && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">City</th>}
                  {visibleColumns.state && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">State</th>}
                  {visibleColumns.zip && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">ZIP</th>}
                  {visibleColumns.county && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">County</th>}
                  {visibleColumns.denomination && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Denomination</th>}
                  {visibleColumns.website && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Website</th>}
                  {visibleColumns.source_url && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Source URL</th>}
                  {visibleColumns.time && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Time</th>}
                  {visibleColumns.date && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Date</th>}
                  {visibleColumns.createdAt && <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>}
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient._id}>
                    {visibleColumns.email && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipient.email}</td>}
                    {visibleColumns.name && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.name || '-'}</td>}
                    {visibleColumns.subject && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.subject || '-'}</td>}
                    {visibleColumns.type && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${recipient.type === 'church' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {recipient.type || 'church'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.tags && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.tags?.length > 0 ? recipient.tags.join(', ') : '-'}
                      </td>
                    )}
                    {visibleColumns.phone && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.phone || '-'}</td>}
                    {visibleColumns.street && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.street || '-'}</td>}
                    {visibleColumns.city && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.city || '-'}</td>}
                    {visibleColumns.state && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.state || '-'}</td>}
                    {visibleColumns.zip && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.zip || '-'}</td>}
                    {visibleColumns.county && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.county || '-'}</td>}
                    {visibleColumns.denomination && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.denomination || '-'}</td>}
                    {visibleColumns.website && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.website ? (
                          <a href={recipient.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            {recipient.website}
                          </a>
                        ) : '-'}
                      </td>
                    )}
                    {visibleColumns.source_url && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.source_url ? (
                          <a href={recipient.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            {recipient.source_url}
                          </a>
                        ) : '-'}
                      </td>
                    )}
                    {visibleColumns.time && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recipient.time || '-'}</td>}
                    {visibleColumns.date && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.date ? new Date(recipient.date).toLocaleDateString() : '-'}
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recipient.createdAt ? new Date(recipient.createdAt).toLocaleDateString() : '-'}
                      </td>
                    )}
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
