import { verifyIndexXAdmin } from '../lib/indexx-auth.js';

import {
  getSites,
  getSearchAnalytics,
  inspectURL,
  getSitemaps
} from '../lib/indexx-google.js';

const DOMAIN = 'https://onlibry.in';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const permission = await verifyIndexXAdmin(req);

  if (!permission.allowed) {
    return res.status(permission.status).json({
      success: false,
      error: 'Access denied'
    });
  }

  try {
    const action = req.query.action || 'overview';
    const days = Number(req.query.days || 28);

    if (![7, 28, 90].includes(days)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }

    let data;

    switch (action) {

      case 'connection':
        data = await getSites();
        break;

      case 'overview':
        data = await getSearchAnalytics(days);
        break;

      case 'queries':
        data = await getSearchAnalytics(days, ['query']);
        break;

      case 'pages':
        data = await getSearchAnalytics(days, ['page']);
        break;

      case 'daily':
        data = await getSearchAnalytics(days, ['date']);
        break;

      case 'devices':
        data = await getSearchAnalytics(days, ['device']);
        break;

      case 'countries':
        data = await getSearchAnalytics(days, ['country']);
        break;

      case 'sitemaps':
        data = await getSitemaps();
        break;

      case 'inspect': {
        let target;

        try {
          if (typeof req.query.url !== 'string') {
            throw new Error('Invalid URL');
          }

          target = new URL(req.query.url);

          if (
            target.origin !== DOMAIN ||
            target.username ||
            target.password ||
            target.hash
          ) {
            throw new Error('Invalid domain');
          }

        } catch {
          return res.status(400).json({
            success: false,
            error: 'Enter a valid Onlibry URL'
          });
        }

        data = await inspectURL(target.href);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown IndexX action'
        });
    }

    return res.status(200).json({
      success: true,
      action,
      fetchedAt: new Date().toISOString(),
      data
    });

  } catch (error) {
    console.error('IndexX API:', error.message);

    return res.status(502).json({
      success: false,
      error: 'Unable to retrieve Search Console data'
    });
  }
}
