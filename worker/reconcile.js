// The shop's nightly settlement reconciliation: an internal job that cron starts behind the
// firewall. It reads the settlement files the payment provider drops overnight, looks up the order
// each payment is for, prints a summary of what does not match that cron mails to finance, and
// archives each file once it is read.
//
// Intentionally insecure, for exercising Draugr's `sca` and `sast` controls on a component declared
// internal and supporting. DO NOT copy these patterns into real code.
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
// sca: lodash 4.17.20, pinned in package.json, carries known advisories: CVE-2021-23337 (high,
// command injection through _.template) and CVE-2020-28500 (medium, a slow regular expression in
// _.trim) among them.
const _ = require('lodash');

const DROP_DIR = process.env.SETTLEMENT_DIR || '/var/spool/settlements';
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || '/var/archive/settlements';
const ORDERS_API = process.env.ORDERS_API || 'http://api.internal:5000';

const summary = _.template(
  'Settlement <%= file %>: <%= checked %> lines checked, <%= mismatched.length %> mismatched.\n' +
    '<% _.forEach(mismatched, function (m) { %>' +
    '  order <%= m.order_id %>: paid <%= m.amount_cents %>, expected <%= m.expected %>\n' +
    '<% }); %>'
);

// serviceToken is what the api's internal routes accept from a job, good for the length of a run.
function serviceToken() {
  // sast: hard-coded signing secret. Anyone with this file can mint a token the api trusts.
  return jwt.sign({ sub: 'settlement-worker', scope: 'orders:read' }, 'recon-nightly-2f8c41d7', {
    expiresIn: '1h',
  });
}

// parse reads a settlement file: a header line, then one comma-separated line per payment.
function parse(file) {
  const [header, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n');
  const columns = header.split(',').map(_.trim);
  return lines.map((line) => _.zipObject(columns, line.split(',').map(_.trim)));
}

async function orderFor(token, orderId) {
  const res = await fetch(`${ORDERS_API}/internal/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : undefined;
}

function archive(file) {
  // sast: OS command injection, the file name is the provider's, and a shell reads it.
  const gzip = spawn('sh', ['-c', `gzip -9 "${file}" && mv "${file}.gz" "${ARCHIVE_DIR}/"`]);
  gzip.on('exit', (code) => {
    if (code !== 0) console.error(`archiving ${file}: exit ${code}`);
  });
}

async function main() {
  const token = serviceToken();
  const names = fs.readdirSync(DROP_DIR).filter((name) => name.endsWith('.csv'));
  for (const name of names) {
    const file = path.join(DROP_DIR, name);
    const rows = parse(file);
    const mismatched = [];
    for (const row of rows) {
      const order = await orderFor(token, row.order_id);
      if (!order || String(order.total_cents) !== row.amount_cents) {
        mismatched.push({ ...row, expected: order ? order.total_cents : 'no such order' });
      }
    }
    process.stdout.write(summary({ file: name, checked: rows.length, mismatched }));
    archive(file);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
