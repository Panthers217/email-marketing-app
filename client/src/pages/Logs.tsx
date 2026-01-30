import React, { useEffect, useState } from 'react';
import { logsAPI } from '../api';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [statusFilter]);

  const loadLogs = async () => {
    try {
      const params: any = { limit: 100 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await logsAPI.list(params);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Send Logs</h1>
        <select
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.campaignId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.campaignId?.subject || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.recipientEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {log.errorMessage || '-'}
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

export default Logs;
