const TOKEN = process.env.VERCEL_TOKEN;
const API = 'https://api.vercel.com';
async function call(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers||{}) }
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, j };
}
(async () => {
  const u = await call('/v2/user');
  console.log('USER HTTP', u.status);
  console.log('login:', u.j && u.j.user && u.j.user.username, '| activeTeamId:', (u.j && u.j.user && u.j.user.activeTeamId) || '(none)');
  const teams = await call('/v2/teams');
  console.log('TEAMS HTTP', teams.status);
  console.log('teams:', (teams.j && teams.j.teams || []).map(t => `${t.name}(${t.id})`).join(' | ') || '(none)');
  console.log('=== done ===');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
