// Notifie Bing/IndexNow des URLs du sitemap live après chaque déploiement.
// Usage: node scripts/indexnow-submit.mjs
const HOST = 'sojori.com';
const KEY = '4a586054ca0c455d80ad5cb690cfe2ba';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemapRes = await fetch(`https://${HOST}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
const urlList = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error('Aucune URL trouvée dans le sitemap, abandon.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

console.log(`IndexNow: ${res.status} ${res.statusText} — ${urlList.length} URLs soumises`);
if (!res.ok) {
  const text = await res.text();
  console.error(text);
  process.exit(1);
}
