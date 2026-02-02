import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';
import DownloadMailingList from '../components/DownloadMailingList';

interface DashboardData {
  recipientCount: number;
  campaignCount: number;
  sendsToday: number;
  recentLogs: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await dashboardAPI.get();
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Recipients
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data?.recipientCount || 0}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Campaigns
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data?.campaignCount || 0}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Sends Today
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data?.sendsToday || 0}
            </dd>
          </div>
        </div>
      </div>

      <DownloadMailingList />

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          {data?.recentLogs && data.recentLogs.length > 0 ? (
            <div className="space-y-2">
              {data.recentLogs.map((log: any) => (
                <div key={log._id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-sm text-gray-900">
                      {log.campaignId?.name || 'Unknown Campaign'}
                    </p>
                    <p className="text-xs text-gray-500">{log.recipientEmail}</p>
                  </div>
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
