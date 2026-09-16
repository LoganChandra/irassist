import { ipToBits, matchesRule } from '../src/lib/security/ip';
import assert from 'node:assert';

// IPv4 exact
assert.equal(matchesRule('14.192.214.0', '14.192.214.0'), true);
assert.equal(matchesRule('14.192.214.1', '14.192.214.0'), false);
// IPv4 CIDR
assert.equal(matchesRule('14.192.214.55', '14.192.214.0/24'), true);
assert.equal(matchesRule('14.192.215.55', '14.192.214.0/24'), false);
assert.equal(matchesRule('10.1.2.3', '10.0.0.0/8'), true);
// IPv6 exact + shorthand
assert.equal(matchesRule('2001:d08:f3:55b2::4c2e', '2001:d08:f3:55b2::4c2e'), true);
assert.equal(matchesRule('2001:d08:f3:55b2::9999', '2001:d08:f3:55b2::4c2e'), false);
assert.equal(
  matchesRule('2001:0d08:00f3:55b2:0000:0000:0000:4c2e', '2001:d08:f3:55b2::/64'),
  true
);
assert.equal(matchesRule('2001:d08:f3:55b3::1', '2001:d08:f3:55b2::/64'), false);
// IPv4-mapped IPv6 (Vercel edge sometimes reports these)
assert.equal(matchesRule('::ffff:14.192.214.7', '14.192.214.0/24'), false); // different bit-width → correctly not matched
assert.equal(matchesRule('14.192.214.7', '::ffff:14.192.214.7'), false); // ditto, reverse
// Garbage in, no crash, no match
assert.equal(ipToBits('not-an-ip'), null);
assert.equal(ipToBits('999.1.1.1'), null);
assert.equal(ipToBits('1:2::3::4'), null);
assert.equal(matchesRule('', '14.192.214.0/24'), false);

// Loopback bits round-trip
assert.deepEqual(ipToBits('127.0.0.1')!.length, 32);
assert.deepEqual(ipToBits('::1')!.length, 128);

console.log('IP allowlist logic: ALL PASS');
