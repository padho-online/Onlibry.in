import React, { useEffect, useState } from 'react';

import {
  Search,
  RefreshCw,
  Download,
  MousePointer,
  Eye,
  TrendingUp,
  Percent,
  Globe,
  FileText
} from 'lucide-react';

import {
  indexxRequest
} from '../../services/indexxService';

const tabs = [
  ['overview', 'Overview'],
  ['queries', 'Keywords'],
  ['pages', 'Pages'],
  ['daily', 'Daily'],
  ['devices', 'Devices'],
  ['countries', 'Countries'],
  ['sitemaps', 'Sitemaps'],
  ['inspect', 'URL Inspection']
];

const formatNumber = value =>
  Number(value || 0).toLocaleString('en-IN');

export default function IndexXDashboard() {
  const [tab, setTab] = useState('overview');
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const [url, setUrl] = useState(
    'https://onlibry.in/'
  );

  useEffect(() => {
    let active = true;

    setData(null);
    setError('');

    if (tab === 'inspect') {
      setLoading(false);
      return;
    }

    setLoading(true);

    indexxRequest(tab, { days })
      .then(result => {
        if (active) setData(result);
      })
      .catch(err => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, days, revision]);

  async function inspect() {
    setLoading(true);
    setError('');
    setData(null);

    try {
      setData(await indexxRequest('inspect', { url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const rows = data?.rows || [];
  const summary = rows[0];

  const metrics = [
    {
      name: 'Total Clicks',
      value: summary
        ? formatNumber(summary.clicks) : '—',
      icon: MousePointer
    },
    {
      name: 'Impressions',
      value: summary
        ? formatNumber(summary.impressions) : '—',
      icon: Eye
    },
    {
      name: 'Average CTR',
      value: summary
        ? `${(summary.ctr * 100).toFixed(2)}%` : '—',
      icon: Percent
    },
    {
      name: 'Average Position',
      value: summary
        ? summary.position.toFixed(2) : '—',
      icon: TrendingUp
    }
  ];

  function exportCSV() {
    if (!rows.length) return;

    const escape = value => {
      let text = String(value ?? '');

      // Prevent spreadsheet formula injection.
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      ['Name', 'Clicks', 'Impressions', 'CTR', 'Position'],
      ...rows.map(row => [
        row.keys?.join(' / ') || 'Total',
        row.clicks,
        row.impressions,
        (row.ctr * 100).toFixed(2) + '%',
        row.position.toFixed(2)
      ])
    ].map(row => row.map(escape).join(',')).join('\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      { type: 'text/csv;charset=utf-8' }
    );

    const link = document.createElement('a');
    const objectURL = URL.createObjectURL(blob);

    link.href = objectURL;
    link.download = `IndexX-${tab}-${days}days.csv`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }

  const inspection =
    data?.inspectionResult?.indexStatusResult;

  return (
    <div className="min-w-0 text-gray-800">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">
            IndexX
            <span className="ml-2 text-xs text-green-700">
              V1.0
            </span>
          </h1>

          <p className="text-xs text-gray-500">
            Onlibry SEO Intelligence Center
          </p>
        </div>

        <div className="flex items-center gap-2">

          <select
            value={days}
            disabled={loading}
            onChange={e => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            disabled={loading}
            onClick={() =>
              tab === 'inspect'
                ? inspect()
                : setRevision(v => v + 1)
            }
            className="p-2 border rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={17}
              className={loading ? 'animate-spin' : ''}
            />
          </button>

          <button
            disabled={!rows.length || loading}
            onClick={exportCSV}
            className="p-2 border rounded-lg"
            title="Download CSV"
          >
            <Download size={17} />
          </button>

        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b mb-5">

        {tabs.map(([id, label]) => (
          <button
            key={id}
            disabled={loading}
            onClick={() => {
              if (tab === id) return;
              setData(null);
              setError('');
              setTab(id);
            }}
            className={`px-3 py-2 text-sm whitespace-nowrap ${
              tab === id
                ? 'border-b-2 border-green-600 text-green-700 font-semibold'
                : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-10 text-center text-sm text-gray-500">
          Fetching Google Search Console data...
        </div>
      )}

      {data?.startDate && (
        <p className="text-xs text-gray-500 mb-4">
          Reporting period: {data.startDate} to {data.endDate}
        </p>
      )}

      {tab === 'overview' && !loading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

          {metrics.map(metric => (
            <div
              key={metric.name}
              className="border rounded-xl p-4"
            >
              <metric.icon
                size={20}
                className="text-green-600 mb-3"
              />

              <p className="text-xs text-gray-500">
                {metric.name}
              </p>

              <p className="text-2xl font-bold mt-1">
                {metric.value}
              </p>
            </div>
          ))}

        </div>
      )}

      {!loading && data && Array.isArray(data.rows) &&
        !rows.length && (
          <p className="py-5 text-sm text-gray-500">
            No finalized search data available for this period.
          </p>
      )}

      {!loading && rows.length > 0 &&
        !['overview', 'inspect', 'sitemaps'].includes(tab) && (

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                {['Name', 'Clicks', 'Impressions', 'CTR', 'Position']
                  .map(label => (
                    <th key={label}
                      className="p-3 text-left whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">

                  <td className="p-3 break-all min-w-40">
                    {row.keys?.join(' / ')}
                  </td>

                  <td className="p-3">
                    {formatNumber(row.clicks)}
                  </td>

                  <td className="p-3">
                    {formatNumber(row.impressions)}
                  </td>

                  <td className="p-3">
                    {(row.ctr * 100).toFixed(2)}%
                  </td>

                  <td className="p-3">
                    {row.position.toFixed(2)}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {tab === 'sitemaps' && !loading && data && (
        <div className="space-y-3">

          {!(data.sitemap || []).length && (
            <p className="text-sm text-gray-500">
              No submitted sitemaps returned.
            </p>
          )}

          {(data.sitemap || []).map(item => (
            <div
              key={item.path}
              className="border rounded-xl p-4"
            >
              <FileText size={20}
                className="text-green-600 mb-2"
              />

              <p className="font-medium break-all">
                {item.path}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">

                <p>Errors: {item.errors ?? '—'}</p>
                <p>Warnings: {item.warnings ?? '—'}</p>
                <p>Pending: {item.isPending ? 'Yes' : 'No'}</p>
                <p>Last read: {item.lastDownloaded || '—'}</p>

              </div>

              {(item.contents || []).map((content, i) => (
                <p key={i} className="mt-2 text-sm">
                  {content.type}: {content.submitted ?? '—'}
                  {' '}submitted URLs
                </p>
              ))}

            </div>
          ))}

        </div>
      )}

      {tab === 'inspect' && (
        <div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="url"
              value={url}
              disabled={loading}
              onChange={e => setUrl(e.target.value)}
              className="min-w-0 flex-1 border rounded-lg p-3 text-sm"
              placeholder="Enter Onlibry URL"
            />

            <button
              disabled={loading}
              onClick={inspect}
              className="bg-green-600 text-white p-3 rounded-lg"
              title="Inspect URL"
            >
              <Search size={18} />
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Shows Google's stored index information, not a live test.
          </p>

          {inspection && (
            <div className="border rounded-xl p-4 space-y-3">

              <div className="flex items-center gap-2">
                <Globe size={20} />

                <h2 className="font-bold">
                  {inspection.coverageState ||
                    'Index status unavailable'}
                </h2>
              </div>

              {[
                ['Verdict', inspection.verdict],
                ['Indexing State', inspection.indexingState],
                ['Robots State', inspection.robotsTxtState],
                ['Page Fetch', inspection.pageFetchState],
                ['Last Crawl', inspection.lastCrawlTime],
                ['User Canonical', inspection.userCanonical],
                ['Google Canonical', inspection.googleCanonical],
                ['Crawled As', inspection.crawledAs]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border-b pb-2 text-sm"
                >
                  <p className="text-gray-500 text-xs">
                    {label}
                  </p>

                  <p className="font-medium break-all">
                    {value || 'Not available'}
                  </p>
                </div>
              ))}

            </div>
          )}

        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">
        Source: Google Search Console API · Read-only integration
      </p>

    </div>
  );
}
