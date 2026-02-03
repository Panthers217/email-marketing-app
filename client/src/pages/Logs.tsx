import React, { useEffect, useState } from 'react';
import { logsAPI } from '../api';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ 
    sent: 0, 
    failed: 0, 
    queued: 0, 
    total: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    opened: 0,
    clicked: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    name: '',
    city: '',
    county: '',
    subject: '',
    date: '',
    time: '',
    deliveryStatus: '',
    opened: false,
    clicked: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    campaign: true,
    subject: true,
    recipient: true,
    name: true,
    status: true,
    delivery: true,
    engagement: true,
    sentAt: true,
    error: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showColumnDropdown && !target.closest('.column-dropdown')) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown]);

  const loadLogs = async () => {
    try {
      const params: any = { limit: 500 };
      if (filters.status) params.status = filters.status;
      if (filters.name) params.name = filters.name;
      if (filters.city) params.city = filters.city;
      if (filters.county) params.county = filters.county;
      if (filters.subject) params.subject = filters.subject;
      if (filters.date) params.date = filters.date;
      if (filters.time) params.time = filters.time;
      if (filters.deliveryStatus) params.deliveryStatus = filters.deliveryStatus;
      if (filters.opened) params.opened = 'true';
      if (filters.clicked) params.clicked = 'true';
      
      const response = await logsAPI.list(params);
      setLogs(response.data.logs || response.data);
      setCounts(response.data.counts || { 
        sent: 0, failed: 0, queued: 0, total: 0,
        delivered: 0, bounced: 0, complained: 0, opened: 0, clicked: 0 
      });
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      name: '',
      city: '',
      county: '',
      subject: '',
      date: '',
      time: '',
      deliveryStatus: '',
      opened: false,
      clicked: false,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'opened' || key === 'clicked') return value === true;
    return value !== '';
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const toggleAllColumns = () => {
    const allSelected = Object.values(visibleColumns).every(v => v);
    const newState = !allSelected;
    setVisibleColumns({
      campaign: newState,
      subject: newState,
      recipient: newState,
      name: newState,
      status: newState,
      delivery: newState,
      engagement: newState,
      sentAt: newState,
      error: newState,
    });
  };

  const allColumnsSelected = Object.values(visibleColumns).every(v => v);
  const selectedColumnCount = Object.values(visibleColumns).filter(v => v).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Send Logs</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            } hover:opacity-80`}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setFilters({ ...filters, status: filters.status === 'sent' ? '' : 'sent' })}
          className={`bg-white shadow rounded-lg p-4 text-left hover:shadow-md transition-shadow ${
            filters.status === 'sent' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{counts.sent}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: filters.status === 'failed' ? '' : 'failed' })}
          className={`bg-white shadow rounded-lg p-4 text-left hover:shadow-md transition-shadow ${
            filters.status === 'failed' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{counts.failed}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: filters.status === 'queued' ? '' : 'queued' })}
          className={`bg-white shadow rounded-lg p-4 text-left hover:shadow-md transition-shadow ${
            filters.status === 'queued' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Queued</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.queued}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </button>
      </div>

      {/* Delivery & Engagement Stats */}
      {(counts.delivered > 0 || counts.bounced > 0 || counts.opened > 0 || counts.clicked > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📬 Delivery & Engagement Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setFilters({ ...filters, deliveryStatus: filters.deliveryStatus === 'delivered' ? '' : 'delivered' })}
              className={`delivered-card bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer ${
                filters.deliveryStatus === 'delivered' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <p className="text-xs text-gray-600">Delivered</p>
              <p className="text-xl font-bold text-blue-600">{counts.delivered}</p>
            </button>
            <button
              onClick={() => setFilters({ ...filters, deliveryStatus: filters.deliveryStatus === 'bounced' ? '' : 'bounced' })}
              className={`bounced-card bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer ${
                filters.deliveryStatus === 'bounced' ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              <p className="text-xs text-gray-600">Bounced</p>
              <p className="text-xl font-bold text-orange-600">{counts.bounced}</p>
            </button>
            <button
              onClick={() => setFilters({ ...filters, opened: !filters.opened })}
              className={`opened-card bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer ${
                filters.opened ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <p className="text-xs text-gray-600">Opened</p>
              <p className="text-xl font-bold text-indigo-600">{counts.opened}</p>
              {counts.sent > 0 && (
                <p className="text-xs text-gray-500">{((counts.opened / counts.sent) * 100).toFixed(1)}% rate</p>
              )}
            </button>
            <button
              onClick={() => setFilters({ ...filters, clicked: !filters.clicked })}
              className={`clicked-card bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer ${
                filters.clicked ? 'ring-2 ring-teal-500' : ''
              }`}
            >
              <p className="text-xs text-gray-600">Clicked</p>
              <p className="text-xl font-bold text-teal-600">{counts.clicked}</p>
              {counts.opened > 0 && (
                <p className="text-xs text-gray-500">{((counts.clicked / counts.opened) * 100).toFixed(1)}% CTR</p>
              )}
            </button>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Filter Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Search by city..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <input
                type="text"
                placeholder="Search by county..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.county}
                onChange={(e) => setFilters({ ...filters, county: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Subject</label>
              <input
                type="text"
                placeholder="Search by subject..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                placeholder="e.g., 14:30 or 2:30"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                value={filters.time}
                onChange={(e) => setFilters({ ...filters, time: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Column Visibility Dropdown - Always visible */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Table Columns</span>
            <div className="relative column-dropdown">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColumnDropdown(!showColumnDropdown);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">Show Columns ({selectedColumnCount}/9)</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {showColumnDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={allColumnsSelected}
                        onChange={toggleAllColumns}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm font-semibold text-gray-900">Select All</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.campaign}
                        onChange={() => toggleColumn('campaign')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Campaign</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.subject}
                        onChange={() => toggleColumn('subject')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Subject</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.recipient}
                        onChange={() => toggleColumn('recipient')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Recipient</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.name}
                        onChange={() => toggleColumn('name')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Name</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.status}
                        onChange={() => toggleColumn('status')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Status</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.delivery}
                        onChange={() => toggleColumn('delivery')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Delivery</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.engagement}
                        onChange={() => toggleColumn('engagement')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Engagement</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.sentAt}
                        onChange={() => toggleColumn('sentAt')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Sent At</span>
                    </label>
                    <label 
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.error}
                        onChange={() => toggleColumn('error')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-sm text-gray-700">Error</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {hasActiveFilters ? 'No logs match your filters' : 'No logs found'}
          </div>
        ) : (
          <div>
            {hasActiveFilters && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-sm text-blue-800">
                  Showing {logs.length} log{logs.length !== 1 ? 's' : ''} matching your filters
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {visibleColumns.campaign && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  )}
                  {visibleColumns.subject && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  )}
                  {visibleColumns.recipient && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  )}
                  {visibleColumns.name && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  )}
                  {visibleColumns.delivery && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  )}
                  {visibleColumns.engagement && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  )}
                  {visibleColumns.sentAt && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                  )}
                  {visibleColumns.error && (
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id}>
                    {visibleColumns.campaign && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.campaignId?.name || 'Unknown'}
                      </td>
                    )}
                    {visibleColumns.subject && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.campaignId?.subject || '-'}
                      </td>
                    )}
                    {visibleColumns.recipient && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.recipientEmail}
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.recipientId?.name || '-'}
                      </td>
                    )}
                    {visibleColumns.status && (
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
                    )}
                    {visibleColumns.delivery && (
                      <td className="px-6 py-4 whitespace-nowrap">
                      {log.deliveryStatus ? (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            log.deliveryStatus === 'delivered'
                              ? 'bg-blue-100 text-blue-800'
                              : log.deliveryStatus === 'bounced'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                          title={
                            log.deliveryStatus === 'bounced' && log.bounceReason
                              ? log.bounceReason
                              : undefined
                          }
                        >
                          {log.deliveryStatus === 'delivered' && '✓ Delivered'}
                          {log.deliveryStatus === 'bounced' && '⚠ Bounced'}
                          {log.deliveryStatus === 'complained' && '🚫 Spam'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                      </td>
                    )}
                    {visibleColumns.engagement && (
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {log.openedAt && (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded" title={`Opened: ${new Date(log.openedAt).toLocaleString()}`}>
                            📖 Opened
                          </span>
                        )}
                        {log.clickedAt && (
                          <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded" title={`Clicked: ${new Date(log.clickedAt).toLocaleString()}`}>
                            🔗 Clicked
                          </span>
                        )}
                        {!log.openedAt && !log.clickedAt && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                      </td>
                    )}
                    {visibleColumns.sentAt && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                      </td>
                    )}
                    {visibleColumns.error && (
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate" title={log.errorMessage || log.bounceReason || undefined}>
                        {log.errorMessage || log.bounceReason || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
