import React, { useEffect, useState } from 'react';
import { settingsAPI } from '../api';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    senderName: '',
    senderEmail: '',
    logoUrl: '',
    websiteUrl: '',
    resendApiKey: '',
    mongoUri: '',
  });
  const [status, setStatus] = useState({ resendConnected: false, mongoConnected: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data.exists) {
        setFormData({
          companyName: response.data.companyName || '',
          senderName: response.data.senderName || '',
          senderEmail: response.data.senderEmail || '',
          logoUrl: response.data.logoUrl || '',
          websiteUrl: response.data.websiteUrl || '',
          resendApiKey: '',
          mongoUri: '',
        });
      }
      setStatus({
        resendConnected: response.data.resendConnected,
        mongoConnected: response.data.mongoConnected,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await settingsAPI.update(formData);
      setMessage('Settings saved successfully!');
      await loadSettings();
      // Clear sensitive fields
      setFormData((prev) => ({ ...prev, resendApiKey: '', mongoUri: '' }));
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestResend = async () => {
    if (!testEmail) {
      setMessage('Please enter a test email address');
      return;
    }
    setTesting(true);
    setMessage('');

    try {
      await settingsAPI.testResend(testEmail);
      setMessage('Test email sent successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleTestMongo = async () => {
    setTesting(true);
    setMessage('');

    try {
      await settingsAPI.testMongo();
      setMessage('MongoDB connection successful!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'MongoDB connection failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          ⚠️ Important: Your sender email must be verified in Resend before sending campaigns.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sender Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sender Email (must be verified in Resend)
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={formData.senderEmail}
              onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Logo URL
            </label>
            <input
              type="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              This logo will appear at the top of all campaign emails (unless overridden in a specific campaign). Recommended size: 300x200px
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website URL
            </label>
            <input
              type="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              This link will appear at the bottom of all campaign emails (unless overridden in a specific campaign)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Resend API Key
              {status.resendConnected && (
                <span className="ml-2 text-green-600 text-xs">✓ Connected</span>
              )}
            </label>
            <input
              type="password"
              placeholder="Leave empty to keep existing key"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={formData.resendApiKey}
              onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              MongoDB URI
              {status.mongoConnected && (
                <span className="ml-2 text-green-600 text-xs">✓ Connected</span>
              )}
            </label>
            <input
              type="password"
              placeholder="Leave empty to keep existing URI"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={formData.mongoUri}
              onChange={(e) => setFormData({ ...formData, mongoUri: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Test Connections</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Test email address"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              onClick={handleTestResend}
              disabled={testing}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Resend
            </button>
          </div>

          <button
            onClick={handleTestMongo}
            disabled={testing}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Test MongoDB Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
