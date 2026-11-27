import { createSign } from 'node:crypto';

let cachedToken = null;
let expiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < expiresAt) {
    return cachedToken;
  }

  const email = process.env.INDEXX_CLIENT_EMAIL;
  const privateKey = process.env.INDEXX_PRIVATE_KEY
    ?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google credentials missing');
  }

  const now = Math.floor(Date.now() / 1000);

  const encode = value =>
    Buffer.from(JSON.stringify(value))
      .toString('base64url');

  const header = encode({
    alg: 'RS256',
    typ: 'JWT'
  });

  const payload = encode({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });

  const unsigned = `${header}.${payload}`;

  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .end()
    .sign(privateKey, 'base64url');

  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type:
          'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      }),
      signal: AbortSignal.timeout(10000)
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error('Google authentication failed');
  }

  cachedToken = data.access_token;
  expiresAt =
    Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

export async function googleRequest(url, body) {
  const token = await getAccessToken();

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    ...(body && {
      body: JSON.stringify(body)
    }),
    signal: AbortSignal.timeout(15000)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      'IndexX Google API status:',
      response.status
    );

    throw new Error(
      `Google API request failed (${response.status})`
    );
  }

  return data;
}

export function getSiteURL() {
  return process.env.INDEXX_SITE_URL ||
    'sc-domain:onlibry.in';
}

export async function getSites() {
  return googleRequest(
    'https://www.googleapis.com/webmasters/v3/sites'
  );
}

export async function getSearchAnalytics(
  days = 28,
  dimensions = []
) {
  // Search Console reporting dates use Pacific Time.
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const part = type =>
    dateParts.find(p => p.type === type).value;

  const end = new Date(
    `${part('year')}-${part('month')}-${part('day')}T00:00:00Z`
  );

  // Allow for Search Console reporting delay.
  end.setUTCDate(end.getUTCDate() - 3);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);

  const format = date =>
    date.toISOString().slice(0, 10);

  const site = encodeURIComponent(getSiteURL());

  const data = await googleRequest(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      startDate: format(start),
      endDate: format(end),
      dimensions,
      type: 'web',
      dataState: 'final',
      rowLimit: 1000
    }
  );

  return {
    startDate: format(start),
    endDate: format(end),
    rows: data.rows || []
  };
}

export async function inspectURL(url) {
  return googleRequest(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    {
      inspectionUrl: url,
      siteUrl: getSiteURL(),
      languageCode: 'en-US'
    }
  );
}

export async function getSitemaps() {
  const site = encodeURIComponent(getSiteURL());

  return googleRequest(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps`
  );
}
