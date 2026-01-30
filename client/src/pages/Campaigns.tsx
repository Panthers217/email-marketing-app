import React, { useEffect, useState } from 'react';
import { campaignsAPI, recipientsAPI } from '../api';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlBody: '',
  });
  const [sendConfig, setSendConfig] = useState({
    sendToAll: true,
    selectedRecipients: [] as string[],
  });
  const [recipientSearch, setRecipientSearch] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadRecipients();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await campaignsAPI.list();
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await recipientsAPI.list();
      setRecipients(response.data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignsAPI.create(formData);
      setMessage('Campaign created successfully!');
      setFormData({ name: '', subject: '', htmlBody: '' });
      setShowCreateForm(false);
      await loadCampaigns();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to create campaign');
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      const data: any = { 
        sendToAll: sendConfig.sendToAll,
        recipientIds: sendConfig.sendToAll ? [] : sendConfig.selectedRecipients
      };
      
      const response = await campaignsAPI.send(selectedCampaign._id, data);
      setMessage(`Campaign sent! ${response.data.message}`);
      setShowSendForm(false);
      setSelectedCampaign(null);
      setSendConfig({ sendToAll: true, selectedRecipients: [] });
      setRecipientSearch('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignsAPI.delete(id);
      setMessage('Campaign deleted successfully!');
      await loadCampaigns();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to delete campaign');
    }
  };

  const handleRecipientSelection = (recipientId: string) => {
    setSendConfig(prev => {
      const isSelected = prev.selectedRecipients.includes(recipientId);
      return {
        ...prev,
        selectedRecipients: isSelected
          ? prev.selectedRecipients.filter(id => id !== recipientId)
          : [...prev.selectedRecipients, recipientId]
      };
    });
  };

  const handleSelectAllRecipients = () => {
    const filteredRecipients = getFilteredRecipients();
    setSendConfig(prev => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.length === filteredRecipients.length 
        ? [] 
        : filteredRecipients.map(r => r._id)
    }));
  };

  const getFilteredRecipients = () => {
    if (!recipientSearch.trim()) return recipients;
    const search = recipientSearch.toLowerCase();
    return recipients.filter(r => 
      (r.city && r.city.toLowerCase().includes(search)) ||
      (r.county && r.county.toLowerCase().includes(search))
    );
  };

  const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">Hello {{name}}!</h1>
  <p>This is your email marketing campaign.</p>
  <p>You can customize this HTML to your needs. Use {{name}} and {{email}} for personalization.</p>
  <hr style="margin: 30px 0;">
  <p style="color: #666; font-size: 12px;">
    You're receiving this email at {{email}}.
  </p>
</body>
</html>`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Campaign
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('success') || message.includes('sent') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Create Campaign</h2>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML Body * 
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, htmlBody: defaultTemplate })}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Use Template
                </button>
              </label>
              <textarea
                rows={12}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 font-mono text-xs"
                placeholder="Enter HTML content here. Use {{name}} and {{email}} for personalization."
                value={formData.htmlBody}
                onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Create Campaign
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showSendForm && selectedCampaign && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Send Campaign: {selectedCampaign.name}</h2>
          <form onSubmit={handleSendCampaign} className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendConfig.sendToAll}
                  onChange={(e) => setSendConfig({ ...sendConfig, sendToAll: e.target.checked, selectedRecipients: [] })}
                  className="mr-2"
                />
                Send to all recipients
              </label>
            </div>
            {!sendConfig.sendToAll && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select Recipients</label>
                  <button
                    type="button"
                    onClick={handleSelectAllRecipients}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {sendConfig.selectedRecipients.length === getFilteredRecipients().length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search by city or county..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                  />
                </div>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                  {recipients.length === 0 ? (
                    <p className="text-sm text-gray-500">No recipients available</p>
                  ) : getFilteredRecipients().length === 0 ? (
                    <p className="text-sm text-gray-500">No recipients match your search</p>
                  ) : (
                    getFilteredRecipients().map((recipient) => (
                      <label key={recipient._id} className="flex items-center py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={sendConfig.selectedRecipients.includes(recipient._id)}
                          onChange={() => handleRecipientSelection(recipient._id)}
                          className="mr-2"
                        />
                        <span className="text-sm flex-1">
                          {recipient.email} {recipient.name && `(${recipient.name})`}
                          {(recipient.city || recipient.county) && (
                            <span className="text-xs text-gray-500 ml-2">
                              {[recipient.city, recipient.county].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {sendConfig.selectedRecipients.length} recipient(s) selected
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!sendConfig.sendToAll && sendConfig.selectedRecipients.length === 0}
              >
                Send Now
              </button>
              <button type="button" onClick={() => { 
                setShowSendForm(false); 
                setSelectedCampaign(null); 
                setSendConfig({ sendToAll: true, selectedRecipients: [] });
                setRecipientSearch('');
              }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No campaigns found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Subject: {campaign.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setSendConfig({ sendToAll: true, selectedRecipients: [] });
                        setRecipientSearch('');
                        setShowSendForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
