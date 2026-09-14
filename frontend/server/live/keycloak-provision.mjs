#!/usr/bin/env node
/**
 * Program v3.0 — G3 LIVE provisioning harness.
 *
 * Creates the approved local Keycloak test topology against a RUNNING Keycloak:
 *   - realm `iips`
 *   - OIDC client `iips-spa` (public SPA; authorization-code + PKCE in production; the
 *     `directAccessGrantsEnabled` flag is enabled ONLY to let the headless LIVE test obtain
 *     real tokens over the password grant — a dev/test convenience, not the production flow)
 *   - governed realm roles `iips-admin` / `iips-analyst` / `iips-viewer`
 *   - development users: admin-a, analyst-a, viewer-a (tenant-A), analyst-b (tenant-B)
 *   - a protocol mapper that carries the user's `tenant` attribute into the access token
 *     claim, so the platform can validate tenant context (never trusting the client/URL).
 *
 * DEV/TEST ONLY. No production secrets are committed; all credentials are read from
 * environment variables with clearly-test defaults.
 */
const KC = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const ADMIN_PW = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const TEST_PW = process.env.IIPS_TEST_PASSWORD || 'iips-test-pw-2026';

async function adminToken() {
  const res = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: ADMIN, password: ADMIN_PW }),
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`admin login failed ${res.status}: ${t}`);
  return JSON.parse(t).access_token;
}

async function post(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) throw new Error(`POST ${url} -> ${res.status}: ${await res.text()}`);
  return res;
}

async function get(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function main() {
  const AT = await adminToken();

  // 1. Realm
  await post(`${KC}/admin/realms`, { realm: 'iips', enabled: true, registrationAllowed: false, loginWithEmailAllowed: false }, AT);

  // 2. Client (public SPA)
  await post(`${KC}/admin/realms/iips/clients`, {
    clientId: 'iips-spa', name: 'IIPS SPA', enabled: true,
    publicClient: true, directAccessGrantsEnabled: true,
    standardFlowEnabled: true, implicitFlowEnabled: false,
    redirectUris: ['http://localhost:5173/*'], webOrigins: ['http://localhost:5173'],
  }, AT);
  const cid = (await get(`${KC}/admin/realms/iips/clients?clientId=iips-spa`, AT))[0].id;

  // 3. Realm roles
  for (const r of ['iips-admin', 'iips-analyst', 'iips-viewer']) await post(`${KC}/admin/realms/iips/roles`, { name: r }, AT);

  // 4. Protocol mappers on iips-spa
  // 4a. Audience mapper: guarantee the access token's `aud` includes iips-spa.
  await post(`${KC}/admin/realms/iips/clients/${cid}/protocol-mappers/models`, {
    name: 'iips-spa-audience', protocol: 'openid-connect',
    protocolMapper: 'oidc-audience-mapper',
    config: { 'included.client.audience': 'iips-spa', 'id.token.claim': 'true', 'access.token.claim': 'true' },
  }, AT);
  // 4b. User attribute `tenant` -> access-token claim `tenant`
  await post(`${KC}/admin/realms/iips/clients/${cid}/protocol-mappers/models`, {
    name: 'tenant-claim', protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-attribute-mapper',
    config: {
      'user.attribute': 'tenant', 'claim.name': 'tenant',
      'id.token.claim': 'true', 'access.token.claim': 'true', 'userinfo.token.claim': 'true',
      'jsonType.label': 'String',
    },
  }, AT);

  // 5. Users + role assignment
  const roleIds = {};
  for (const r of ['iips-admin', 'iips-analyst', 'iips-viewer']) roleIds[r] = (await get(`${KC}/admin/realms/iips/roles/${r}`, AT)).id;

  const users = [
    { username: 'admin-a', tenant: 'tenant-A', roles: ['iips-admin'] },
    { username: 'analyst-a', tenant: 'tenant-A', roles: ['iips-analyst'] },
    { username: 'viewer-a', tenant: 'tenant-A', roles: ['iips-viewer'] },
    { username: 'admin-b', tenant: 'tenant-B', roles: ['iips-admin'] },
    { username: 'analyst-b', tenant: 'tenant-B', roles: ['iips-analyst'] },
  ];
  for (const u of users) {
    const r = await fetch(`${KC}/admin/realms/iips/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AT}` },
      body: JSON.stringify({
        username: u.username, enabled: true,
        attributes: { tenant: [u.tenant] },
        credentials: [{ type: 'password', value: TEST_PW, temporary: false }],
      }),
    });
    if (!r.ok && r.status !== 409) throw new Error(`user ${u.username} ${r.status}: ${await r.text()}`);
    const uid = (await get(`${KC}/admin/realms/iips/users?username=${u.username}`, AT))[0].id;
    await post(`${KC}/admin/realms/iips/users/${uid}/role-mappings/realm`, u.roles.map((r) => ({ id: roleIds[r], name: r })), AT);
  }

  console.log(`PROVISION OK: realm iips | client iips-spa | roles | users (tenant-A: admin-a,analyst-a,viewer-a | tenant-B: admin-b,analyst-b)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('PROVISION FAIL', e); process.exit(1); });
