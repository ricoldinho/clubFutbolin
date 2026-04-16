const { execSync } = require('node:child_process');

const ALLOWED_HIGH_GHSA = new Set([
  // Transitive dependency in awilix -> fast-glob -> micromatch.
  // Pending upstream fix without safe non-breaking bump in current chain.
  'GHSA-3v7f-55p6-f55p',
  'GHSA-c2c7-rcm5-vvqj',
]);

const HIGH_SEVERITIES = new Set(['high', 'critical']);

const extractGhsaId = (url) => {
  const match = url.match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
  return match ? match[0] : null;
};

const runAuditJson = () => {
  try {
    return execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (typeof error.stdout === 'string' && error.stdout.trim().length > 0) {
      return error.stdout;
    }

    console.error('No se pudo ejecutar `npm audit --json`.');
    if (error.stderr) {
      console.error(String(error.stderr));
    }
    process.exit(1);
  }
};

const rawAuditOutput = runAuditJson();
let audit;

try {
  audit = JSON.parse(rawAuditOutput);
} catch (error) {
  console.error('No se pudo parsear la salida JSON de `npm audit`.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const vulnerabilities = Object.entries(audit.vulnerabilities ?? {});
const blockingFindings = [];
const ignoredFindings = [];

for (const [packageName, vulnerability] of vulnerabilities) {
  const viaEntries = Array.isArray(vulnerability.via) ? vulnerability.via : [];
  const advisoryEntries = viaEntries.filter((entry) => typeof entry === 'object' && entry !== null);

  let packageHasBlocking = false;
  let packageWasIgnored = false;

  for (const advisory of advisoryEntries) {
    const advisorySeverity = String(advisory.severity ?? '').toLowerCase();
    if (!HIGH_SEVERITIES.has(advisorySeverity)) {
      continue;
    }

    const ghsaId = typeof advisory.url === 'string' ? extractGhsaId(advisory.url) : null;
    if (ghsaId && ALLOWED_HIGH_GHSA.has(ghsaId)) {
      ignoredFindings.push({ packageName, ghsaId, url: advisory.url });
      packageWasIgnored = true;
      continue;
    }

    packageHasBlocking = true;
    blockingFindings.push({
      packageName,
      severity: advisorySeverity,
      title: advisory.title ?? 'Advisory',
      url: advisory.url ?? 'N/A',
    });
  }

  // Fallback: if vulnerability is high/critical and we could not inspect advisory metadata,
  // keep it as blocking to avoid false negatives.
  if (!packageHasBlocking && !packageWasIgnored) {
    const packageSeverity = String(vulnerability.severity ?? '').toLowerCase();
    if (HIGH_SEVERITIES.has(packageSeverity) && advisoryEntries.length === 0) {
      blockingFindings.push({
        packageName,
        severity: packageSeverity,
        title: 'Vulnerabilidad sin metadatos de advisory',
        url: 'N/A',
      });
    }
  }
}

if (blockingFindings.length > 0) {
  console.error('Se encontraron vulnerabilidades HIGH/CRITICAL bloqueantes en CI:');
  for (const finding of blockingFindings) {
    console.error(`- [${finding.severity}] ${finding.packageName}: ${finding.title} (${finding.url})`);
  }
  process.exit(1);
}

if (ignoredFindings.length > 0) {
  const uniqueIgnored = new Map();
  for (const finding of ignoredFindings) {
    uniqueIgnored.set(`${finding.packageName}-${finding.ghsaId}`, finding);
  }

  console.log('Audit sin bloqueos HIGH/CRITICAL no permitidos.');
  console.log('Advisories temporalmente permitidos:');
  for (const finding of uniqueIgnored.values()) {
    console.log(`- ${finding.packageName}: ${finding.ghsaId} (${finding.url})`);
  }
  process.exit(0);
}

console.log('Audit limpio: sin vulnerabilidades HIGH/CRITICAL.');
