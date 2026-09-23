const TOKEN = process.env.VERCEL_TOKEN;
const API = 'https://api.vercel.com';
const REPO = 'HJJ644/huishi-prototype';
const REPO_ID = 1373288982;
const PROJ = 'design-huishi';
async function call(path, method = 'GET', body) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, j, raw: t.slice(0, 500) };
}
(async () => {
  // create project (no teamId -> personal account, since activeTeamId is none)
  let r = await call('/v9/projects', 'POST', { name: PROJ });
  console.log('CREATE', r.status, JSON.stringify(r.j).slice(0, 320));
  if (!r.j || !r.j.id) { console.log('CREATE FAILED — name may be taken'); process.exit(1); }
  const pid = r.j.id;
  const acct = r.j.accountId;
  console.log('accountId:', acct, acct.startsWith('team_') ? '(TEAM - bad)' : '(PERSONAL - good)');
  // link github repo
  let l = await call(`/v9/projects/${pid}/link`, 'POST', { repo: REPO });
  console.log('LINK', l.status, JSON.stringify(l.j).slice(0, 200));
  if (!l.ok && l.status !== 200) { console.log('LINK FAILED — your Vercel account may not be connected to GitHub.'); }
  // deploy from git (production)
  let d = await call('/v13/deployments', 'POST', {
    name: PROJ, projectId: pid, target: 'production',
    gitSource: { type: 'github', repoId: REPO_ID, ref: 'main' }
  });
  console.log('DEPLOY', d.status, JSON.stringify(d.j).slice(0, 400));
  if (!d.j || !d.j.id) { console.log('DEPLOY FAILED'); process.exit(1); }
  const did = d.j.id;
  for (let i = 0; i < 30; i++) {
    let s = await call(`/v13/deployments/${did}`);
    const st = s.j && s.j.readyState, tgt = s.j && s.j.target;
    console.log(`poll ${i}: readyState=${st} target=${tgt}`);
    if (st === 'READY' || st === 'ERROR') break;
    await new Promise(res => setTimeout(res, 4000));
  }
  let dom = await call(`/v6/projects/${pid}/domains`);
  console.log('DOMAINS:', (dom.j && dom.j.domains || []).map(x => `${x.name}(${x.verified ? 'v' : 'u'})`).join(', '));
  console.log('=== done ===');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
