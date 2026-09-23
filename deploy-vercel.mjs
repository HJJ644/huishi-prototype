// Deploy the single-file prototype (publish/) to Vercel.
// Token is read from env VERCEL_TOKEN only; never printed.
// NOTE: custom-domain binding intentionally REMOVED (user does not want lambstar.top).
import { readFileSync } from 'node:fs';

const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) { console.error('ERROR: set env VERCEL_TOKEN'); process.exit(2); }

const API = 'https://api.vercel.com';
const REPO = 'HJJ644/huishi-prototype';   // github repo to link (for CI)
const PROJ = 'huishi-prototype';           // vercel project name

const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const post = (url, data) => fetch(url, { method: 'POST', headers: auth, body: JSON.stringify(data) });

let projId = null, projUrl = null, linked = false;

// 1) Get existing project or create one (GitHub-linked for auto-redeploy on push)
const getRes = await fetch(`${API}/v9/projects/${PROJ}`, { headers: auth });
if (getRes.ok) {
  const p = await getRes.json();
  projId = p.id; projUrl = p.url; linked = !!p.gitRepository;
  console.log(`Existing project found: id=${projId} linked=${linked}`);
} else if (getRes.status === 404) {
  console.log('Creating GitHub-linked project...');
  const cr = await post(`${API}/v9/projects`, {
    name: PROJ, gitRepository: { type: 'github', repo: REPO }, framework: null
  });
  const cp = await cr.json();
  console.log(`create HTTP ${cr.status}`);
  if (cr.ok) { projId = cp.id; projUrl = cp.url; linked = !!cp.gitRepository; console.log(`created: id=${projId}`); }
  else { console.log('create failed:', JSON.stringify(cp).slice(0, 300)); }
} else {
  console.log(`get project HTTP ${getRes.status}`);
}

// 2) Deploy
if (linked) {
  console.log('GitHub-linked -> triggering production deployment from repo main...');
  const dr = await post(`${API}/v13/deployments`, {
    name: PROJ, target: 'production', gitSource: { type: 'github', repo: REPO, ref: 'main' }
  });
  const dep = await dr.json();
  console.log(`deploy HTTP ${dr.status}`);
  if (dr.ok) { projId = dep.projectId || projId; projUrl = dep.url || projUrl; }
  else { console.log('deploy note:', JSON.stringify(dep).slice(0, 400)); }
} else {
  console.log('No GitHub link -> uploading publish/ files directly...');
  const idx = readFileSync('publish/index.html', 'utf8');
  const cli = readFileSync('publish/client.html', 'utf8');
  const dr = await post(`${API}/v13/deployments`, {
    name: PROJ,
    files: [ { file: 'index.html', data: idx }, { file: 'client.html', data: cli } ],
    projectSettings: { framework: null, buildCommand: null, outputDirectory: null }
  });
  const dep = await dr.json();
  console.log(`deploy HTTP ${dr.status}`);
  if (dr.ok) { projId = dep.projectId || projId; projUrl = dep.url || projUrl; }
  else { console.log('deploy failed:', JSON.stringify(dep).slice(0, 400)); }
}

console.log('DONE. Project URL: https://' + (projUrl || (PROJ + '.vercel.app')));
console.log('Vercel dashboard: https://vercel.com/dashboard');
