// Move huishi-prototype from team scope to personal account (hjj644)
// Vercel project names are globally unique, so delete old team project first, then recreate in personal scope.
const T = process.env.VERCEL_TOKEN;
if (!T) { console.error('VERCEL_TOKEN missing'); process.exit(1); }
const H = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' };
const API = 'https://api.vercel.com';
const OLD_TEAM = 'team_fzpJpjMDAMT2TneIZINzPt6G';
const REPO = 'HJJ644/huishi-prototype';
const REPO_ID = 1373288982;
const NAME = 'huishi-prototype';

async function j(method, path, body) {
  const r = await fetch(API + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch (e) {}
  return { status: r.status, data };
}
const log = (...a) => console.log(...a);

// 1) delete old team project
log('=== STEP 1: delete old team project ===');
const del = await j('DELETE', `/v9/projects/${NAME}?teamId=${OLD_TEAM}`);
log('DELETE HTTP', del.status, del.data ? JSON.stringify(del.data).slice(0, 160) : '(no body)');
if (del.status >= 400 && del.status !== 404) { log('FATAL: delete failed'); process.exit(1); }

// 2) create personal project (same name, now free)
log('\n=== STEP 2: create personal project ===');
let create = await j('POST', '/v9/projects', { name: NAME });
if (create.status === 409 || (create.data && /name .*already|already taken|conflict/i.test(JSON.stringify(create.data)))) {
  log('name still taken, using fallback name...');
  create = await j('POST', '/v9/projects', { name: NAME + '-2' });
}
log('CREATE HTTP', create.status, JSON.stringify(create.data).slice(0, 250));
const NEW_ID = create.data && create.data.id;
if (!NEW_ID) { log('FATAL: no project id'); process.exit(1); }
log('NEW project id =', NEW_ID, '| accountId =', create.data.accountId);

// if used fallback name, rename to canonical (frees/assigns canonical auto domain)
if (create.data.name !== NAME) {
  log('  renaming to canonical name...');
  const ren = await j('PATCH', `/v9/projects/${NEW_ID}`, { name: NAME });
  log('  RENAME HTTP', ren.status, ren.data && ren.data.name);
}

// 3) link GitHub repo (expects `repo` owner/name)
log('\n=== STEP 3: link GitHub repo ===');
const link = await j('POST', `/v9/projects/${NEW_ID}/link`, { repo: REPO, type: 'github' });
log('LINK HTTP', link.status, JSON.stringify(link.data).slice(0, 200));

// 4) git production deploy (do NOT pass projectId)
log('\n=== STEP 4: git production deploy ===');
const dep = await j('POST', '/v13/deployments', {
  name: NAME,
  target: 'production',
  gitSource: { type: 'github', repoId: REPO_ID, ref: 'main' }
});
log('DEPLOY HTTP', dep.status, JSON.stringify(dep.data).slice(0, 400));
const DPL = dep.data && dep.data.id;
if (!DPL) { log('FATAL: no deployment id'); process.exit(1); }
log('DEPLOY id =', DPL, '| url =', dep.data.url);

// 5) poll
log('\n=== STEP 5: poll deployment ===');
let state = '';
for (let i = 0; i < 40; i++) {
  const p = await j('GET', `/v13/deployments/${DPL}`);
  state = (p.data && p.data.readyState) || '?';
  log(`  poll ${i}: readyState=${state}`);
  if (state === 'READY') break;
  if (state === 'ERROR' || state === 'CANCELED') { log('FATAL: deploy failed'); process.exit(1); }
  await new Promise(r => setTimeout(r, 5000));
}
if (state !== 'READY') { log('FATAL: timeout'); process.exit(1); }

// 6) final verify
log('\n=== STEP 6: final verify ===');
const proj = await j('GET', `/v9/projects/${NAME}`);
log('accountId =', proj.data && proj.data.accountId, '| name =', proj.data && proj.data.name);
log('gitRepo  =', JSON.stringify(proj.data && proj.data.gitRepository));
const doms = await j('GET', `/v6/projects/${NEW_ID}/domains`);
const dl = (doms.data && (doms.data.domains || [])) || [];
for (const d of dl) log('  domain:', d.name, '| verified:', d.verified);

log('\n=== DONE ===');
log('Personal project: https://vercel.com/hjj644/huishi-prototype');
log('Live URL: https://' + NAME + '.vercel.app');
