const os = require('os');

function isPrivateIpv4(address) {
  if (!address) return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  const m = address.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    return n >= 16 && n <= 31;
  }
  return false;
}

function scoreCandidate(name, address) {
  let score = 0;

  // Prefer Wi-Fi interfaces on common platforms
  if (/^en0$/i.test(name)) score += 50; // macOS Wi‑Fi often en0
  if (/^en1$/i.test(name)) score += 40;
  if (/wlan|wifi|wi-fi/i.test(name)) score += 40;

  // Prefer private LAN addresses
  if (address.startsWith('192.168.')) score += 30;
  if (address.startsWith('10.')) score += 20;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) score += 10;

  // De-prioritize link-local (usually not useful for phone access)
  if (address.startsWith('169.254.')) score -= 100;

  return score;
}

function getLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    const list = nets[name] || [];
    for (const info of list) {
      if (!info || info.internal) continue;
      const family =
        typeof info.family === 'string'
          ? info.family
          : info.family === 4
            ? 'IPv4'
            : 'IPv6';
      if (family !== 'IPv4') continue;
      if (!info.address) continue;

      candidates.push({
        name,
        address: info.address,
        score: scoreCandidate(name, info.address),
        isPrivate: isPrivateIpv4(info.address),
      });
    }
  }

  if (!candidates.length) return '';

  // Prefer private LAN IPs
  const privateCandidates = candidates.filter((c) => c.isPrivate);
  const pool = privateCandidates.length ? privateCandidates : candidates;

  pool.sort((a, b) => b.score - a.score);
  return pool[0]?.address || '';
}

module.exports = {
  getLanIp,
};

