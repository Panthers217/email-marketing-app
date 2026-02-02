import React, { useEffect, useState } from 'react';
import { campaignsAPI, recipientsAPI, settingsAPI } from '../api';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [workspaceSettings, setWorkspaceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlBody: '',
    logoUrl: '',
    websiteUrl: '',
  });
  const [isPlainTextMode, setIsPlainTextMode] = useState(false);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [sendConfig, setSendConfig] = useState({
    sendToAll: false,
    selectedRecipients: [] as string[],
  });
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientSearchField, setRecipientSearchField] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [showSendToAllModal, setShowSendToAllModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);
  const [previewRecipient, setPreviewRecipient] = useState<any>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendConfirmationData, setResendConfirmationData] = useState<any>(null);

  useEffect(() => {
    loadCampaigns();
    loadRecipients();
    loadWorkspaceSettings();
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

  const loadWorkspaceSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setWorkspaceSettings(response.data);
    } catch (error) {
      console.error('Failed to load workspace settings:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignsAPI.create(formData);
      setMessage('Campaign created successfully!');
      setFormData({ name: '', subject: '', htmlBody: '', logoUrl: '', websiteUrl: '' });
      setPlainTextContent('');
      setIsPlainTextMode(false);
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
      setShowResendConfirmation(false);
      setSelectedCampaign(null);
      setSendConfig({ sendToAll: true, selectedRecipients: [] });
      setRecipientSearch('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to send campaign');
    }
  };

  const handleSendButtonClick = async (campaign: any) => {
    // Check if campaign has been sent before
    try {
      const statusResponse = await campaignsAPI.getSendStatus(campaign._id);
      const { hasBeenSent, successfulSends } = statusResponse.data;

      if (hasBeenSent) {
        // Show confirmation modal
        setResendConfirmationData({ campaign, successfulSends });
        setShowResendConfirmation(true);
      } else {
        // Proceed to send form directly
        setSelectedCampaign(campaign);
        setSendConfig({ sendToAll: false, selectedRecipients: [] });
        setRecipientSearch('');
        setRecipientSearchField('all');
        setRecipientTypeFilter('all');
        setShowSendForm(true);
      }
    } catch (error) {
      console.error('Failed to check send status:', error);
      // If status check fails, proceed anyway
      setSelectedCampaign(campaign);
      setSendConfig({ sendToAll: false, selectedRecipients: [] });
      setRecipientSearch('');
      setRecipientSearchField('all');
      setRecipientTypeFilter('all');
      setShowSendForm(true);
    }
  };

  const handleConfirmResend = () => {
    setSelectedCampaign(resendConfirmationData.campaign);
    setSendConfig({ sendToAll: false, selectedRecipients: [] });
    setRecipientSearch('');
    setRecipientSearchField('all');
    setRecipientTypeFilter('all');
    setShowResendConfirmation(false);
    setShowSendForm(true);
  };

  const handleCancelResend = () => {
    setShowResendConfirmation(false);
    setResendConfirmationData(null);
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
    let filtered = recipients;
    
    // Apply type filter
    if (recipientTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === recipientTypeFilter);
    }
    
    // Apply search filter
    if (recipientSearch.trim()) {
      const search = recipientSearch.toLowerCase();
      filtered = filtered.filter(r => {
        if (recipientSearchField === 'all') {
          return (
            (r.email && r.email.toLowerCase().includes(search)) ||
            (r.name && r.name.toLowerCase().includes(search)) ||
            (r.subject && r.subject.toLowerCase().includes(search)) ||
            (r.city && r.city.toLowerCase().includes(search)) ||
            (r.county && r.county.toLowerCase().includes(search)) ||
            (r.state && r.state.toLowerCase().includes(search)) ||
            (r.zip && r.zip.toLowerCase().includes(search)) ||
            (r.denomination && r.denomination.toLowerCase().includes(search)) ||
            (r.phone && r.phone.toLowerCase().includes(search)) ||
            (r.street && r.street.toLowerCase().includes(search))
          );
        } else {
          const fieldValue = r[recipientSearchField];
          return fieldValue && fieldValue.toLowerCase().includes(search);
        }
      });
    }
    
    return filtered;
  };

  const convertPlainTextToHtml = (plainText: string): string => {
    // Split by double line breaks to get paragraphs
    const paragraphs = plainText.split(/\n\s*\n/);
    
    const htmlParagraphs = paragraphs.map(para => {
      // Replace single line breaks within paragraphs with <br>
      const withBreaks = para.trim().replace(/\n/g, '<br>');
      return `<p style="margin: 1em 0;">${withBreaks}</p>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
${htmlParagraphs}
</body>
</html>`;
  };

  const handlePlainTextChange = (text: string) => {
    setPlainTextContent(text);
    const html = convertPlainTextToHtml(text);
    setFormData({ ...formData, htmlBody: html });
  };

  const toggleMode = () => {
    if (isPlainTextMode) {
      // Switching to HTML mode - keep the HTML as is
      setIsPlainTextMode(false);
    } else {
      // Switching to Plain Text mode - try to extract text from HTML
      setIsPlainTextMode(true);
      if (!plainTextContent && formData.htmlBody) {
        // Extract text from HTML if there's no plain text content yet
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formData.htmlBody;
        setPlainTextContent(tempDiv.textContent || tempDiv.innerText || '');
      }
    }
  };

  const getPreviewHtml = () => {
    if (!previewCampaign) return '';
    
    let html = previewCampaign.htmlBody;
    
    if (previewRecipient) {
      // Use real recipient data
      html = html.replace(/\{\{name\}\}/g, previewRecipient.name || 'Recipient');
      html = html.replace(/\{\{email\}\}/g, previewRecipient.email || 'email@example.com');
      html = html.replace(/\{\{city\}\}/g, previewRecipient.city || 'City');
      html = html.replace(/\{\{county\}\}/g, previewRecipient.county || 'County');
      html = html.replace(/\{\{subject\}\}/g, previewRecipient.subject || 'Subject');
      html = html.replace(/\{\{time\}\}/g, previewRecipient.time || new Date().toLocaleTimeString());
      html = html.replace(/\{\{date\}\}/g, previewRecipient.date ? new Date(previewRecipient.date).toLocaleDateString() : new Date().toLocaleDateString());
    } else {
      // Use sample data
      html = html.replace(/\{\{name\}\}/g, 'John Doe');
      html = html.replace(/\{\{email\}\}/g, 'john.doe@example.com');
      html = html.replace(/\{\{city\}\}/g, 'Jacksonville');
      html = html.replace(/\{\{county\}\}/g, 'Duval County');
      html = html.replace(/\{\{subject\}\}/g, 'Newsletter Subscription');
      html = html.replace(/\{\{time\}\}/g, '14:30:00');
      html = html.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    }
    
    // Inject logo at the top if logoUrl exists
    if (previewCampaign.logoUrl) {
      const logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${previewCampaign.logoUrl}" alt="Logo" style="width: 300px; height: 200px; object-fit: contain;" /></div>`;
      // Insert after opening body tag or at the beginning
      const bodyMatch = html.match(/<body[^>]*>/i);
      if (bodyMatch) {
        html = html.replace(bodyMatch[0], bodyMatch[0] + logoHtml);
      } else {
        html = logoHtml + html;
      }
    }

    // Append website URL at the bottom if websiteUrl exists
    if (previewCampaign.websiteUrl) {
      const websiteHtml = `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;"><p>Visit our website: <a href="${previewCampaign.websiteUrl}" style="color: #3b82f6; text-decoration: underline;">${previewCampaign.websiteUrl}</a></p></div>`;
      const bodyEndMatch = html.match(/<\/body>/i);
      if (bodyEndMatch) {
        html = html.replace(bodyEndMatch[0], websiteHtml + bodyEndMatch[0]);
      } else {
        html = html + websiteHtml;
      }
    }
    
    return html;
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
  <p><strong>Note:</strong> If you've added a logo URL, it will automatically appear at the top of this email (300x200px).</p>
  <p>You can customize this HTML to your needs.</p>
  <p><strong>Available personalization fields:</strong></p>
  <ul>
    <li>{{name}} - Recipient name</li>
    <li>{{email}} - Recipient email</li>
    <li>{{city}} - Recipient city</li>
    <li>{{county}} - Recipient county</li>
    <li>{{subject}} - Recipient subject</li>
    <li>{{time}} - Time email was sent</li>
    <li>{{date}} - Date email was sent</li>
  </ul>
  <hr style="margin: 30px 0;">
  <p style="color: #666; font-size: 12px;">
    You're receiving this email at {{email}} from {{city}}, {{county}}.
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

      {showResendConfirmation && resendConfirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Campaign Already Sent
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              This campaign has already been sent to <span className="font-semibold">{resendConfirmationData.successfulSends} recipient(s)</span>. Are you sure you want to send it again?
            </p>
            <p className="text-xs text-gray-500 text-center mb-6">
              Campaign: <span className="font-medium">{resendConfirmationData.campaign.name}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelResend}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResend}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Yes, Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendToAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Send to All Recipients?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              You are about to send this campaign to <span className="font-semibold">{recipients.length} recipient(s)</span>. This action cannot be undone.
            </p>
            <p className="text-xs text-gray-500 text-center mb-6">
              Are you sure you want to proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSendConfig({ ...sendConfig, sendToAll: false, selectedRecipients: [] });
                  setShowSendToAllModal(false);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSendToAllModal(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Yes, Send to All
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Preview: {previewCampaign.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Subject: {previewCampaign.subject}</p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewCampaign(null);
                  setPreviewRecipient(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview with recipient data (optional)
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                  value={previewRecipient?._id || ''}
                  onChange={(e) => {
                    const recipient = recipients.find(r => r._id === e.target.value);
                    setPreviewRecipient(recipient || null);
                  }}
                >
                  <option value="">Use sample data</option>
                  {recipients.map(recipient => (
                    <option key={recipient._id} value={recipient._id}>
                      {recipient.email} {recipient.name && `(${recipient.name})`}
                    </option>
                  ))}
                </select>
                {previewRecipient && (
                  <p className="text-xs text-gray-500 mt-1">
                    Previewing with: {previewRecipient.name || 'Name not set'}, {previewRecipient.city || 'No city'}, {previewRecipient.county || 'No county'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto border-t p-6 bg-gray-50">
              <div className="bg-white p-6 rounded shadow-sm">
                <iframe
                  srcDoc={getPreviewHtml()}
                  className="w-full h-[500px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewCampaign(null);
                  setPreviewRecipient(null);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
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
              <label className="block text-sm font-medium text-gray-700">Logo URL (optional)</label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Logo will appear at the top of the email (300x200px). Leave empty to use workspace default.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website URL (optional)</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Website link will appear at the bottom of the email. Leave empty to use workspace default.</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Body * 
                  <span className="ml-2 text-xs text-gray-500">
                    ({isPlainTextMode ? 'Plain Text Mode' : 'HTML Mode'})
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border"
                  >
                    Switch to {isPlainTextMode ? 'HTML' : 'Plain Text'} Mode
                  </button>
                  {!isPlainTextMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, htmlBody: defaultTemplate });
                          setPlainTextContent('');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Use Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.htmlBody) {
                            setPreviewCampaign({ 
                              name: formData.name || 'New Campaign', 
                              subject: formData.subject || 'Email Subject',
                              htmlBody: formData.htmlBody,
                              logoUrl: formData.logoUrl || workspaceSettings?.logoUrl || '',
                              websiteUrl: workspaceSettings?.websiteUrl || ''
                            });
                            setShowPreview(true);
                          }
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800"
                        disabled={!formData.htmlBody}
                      >
                        Preview
                      </button>
                    </>
                  )}
                  {isPlainTextMode && formData.htmlBody && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCampaign({ 
                          name: formData.name || 'New Campaign', 
                          subject: formData.subject || 'Email Subject',
                          htmlBody: formData.htmlBody,
                          logoUrl: formData.logoUrl || workspaceSettings?.logoUrl || '',
                          websiteUrl: workspaceSettings?.websiteUrl || ''
                        });
                        setShowPreview(true);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
              {isPlainTextMode ? (
                <>
                  <textarea
                    rows={16}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6' }}
                    placeholder="Type your email here like you would in Gmail or Yahoo...&#10;&#10;Press Enter twice for new paragraphs.&#10;Available fields: {{name}}, {{email}}, {{city}}, {{county}}, {{subject}}, {{time}}, {{date}}"
                    value={plainTextContent}
                    onChange={(e) => handlePlainTextChange(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Type naturally like in Gmail/Yahoo. Press Enter twice for paragraph breaks. Your text will be converted to HTML automatically.
                  </p>
                </>
              ) : (
                <>
                  <textarea
                    rows={12}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 font-mono text-xs"
                    placeholder="Enter HTML content here. Available fields: {{name}}, {{email}}, {{city}}, {{county}}, {{subject}}, {{time}}, {{date}}"
                    value={formData.htmlBody}
                    onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: For easier editing, switch to Plain Text Mode above.
                  </p>
                </>
              )}
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
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowSendToAllModal(true);
                      setSendConfig({ ...sendConfig, sendToAll: true, selectedRecipients: [] });
                    } else {
                      setSendConfig({ ...sendConfig, sendToAll: false, selectedRecipients: [] });
                    }
                  }}
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
                <div className="mb-2 flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search recipients..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                      value={recipientSearchField}
                      onChange={(e) => setRecipientSearchField(e.target.value)}
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
                  <div className="w-32">
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                      value={recipientTypeFilter}
                      onChange={(e) => setRecipientTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="church">Church</option>
                      <option value="artist">Artist</option>
                    </select>
                  </div>
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
                setSendConfig({ sendToAll: false, selectedRecipients: [] });
                setRecipientSearch('');
                setRecipientSearchField('all');
                setRecipientTypeFilter('all');
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
                    <h3 className="text-lg font-medium text-gray-900">
                      {campaign.name}
                      {campaign.logoUrl && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          📷 Has Logo
                        </span>
                      )}
                      {campaign.websiteUrl && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          🔗 Has Website
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Subject: {campaign.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewCampaign({
                          ...campaign,
                          logoUrl: campaign.logoUrl || workspaceSettings?.logoUrl || '',
                          websiteUrl: campaign.websiteUrl || workspaceSettings?.websiteUrl || ''
                        });
                        setPreviewRecipient(null);
                        setShowPreview(true);
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleSendButtonClick(campaign)}
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
