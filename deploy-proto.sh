#!/usr/bin/env bash
# Create a NEW GitHub repo for the single-file prototype and push the local 'main'.
set +e
cd "C:/Users/Administrator/WorkBuddy/2026-09-07-18-24-22"

REPO="huishi-prototype"
OWNER="HJJ644"

CRED=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill)
TOKEN=$(echo "$CRED" | awk -F= '/^password=/{print $2}')
if [ -z "$TOKEN" ]; then echo "ERROR: no stored GitHub credential"; exit 2; fi

# repo creation body — ASCII only (GitHub rejects non-ASCII in inline JSON via this shell)
BODY_JSON='{"name":"huishi-prototype","description":"Huishi Workbench - single-file illustrator commission management prototype. Static site deployed via Vercel (vercel.json -> publish/).","private":false,"auto_init":false,"has_issues":true}'

echo "Creating repository $OWNER/$REPO ..."
RESP=$(curl -s -w "\nHTTP_%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY_JSON" \
  https://api.github.com/user/repos)
HTTP=$(echo "$RESP" | tail -n1 | sed 's/HTTP_//')
BODY=$(echo "$RESP" | sed '$d')
echo "Create repo HTTP status: $HTTP"
echo "$BODY" | grep -oE '"(html_url|clone_url|full_name|ssh_url)": ?"[^"]*"' | head -n6
if [ "$HTTP" != "201" ]; then
  echo "ERROR: repo creation failed (HTTP $HTTP). $BODY" | head -c 400
  exit 3
fi

# point local remote at the new repo and push
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$OWNER/$REPO.git"
git branch -M main
echo "Pushing main -> https://github.com/$OWNER/$REPO ..."
PUSHOUT=$(git push -u origin main 2>&1)
PUSHRC=$?
echo "$PUSHOUT" | sed -E 's/(ghp|github_pat)[_A-Za-z0-9]+/<token-redacted>/g'
echo "git push exit code: $PUSHRC"
if [ $PUSHRC -ne 0 ]; then echo "ERROR: git push failed."; exit 4; fi
echo "DONE: https://github.com/$OWNER/$REPO"
