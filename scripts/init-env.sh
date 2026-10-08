#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
from pathlib import Path
import secrets, os
path=Path('.env')
text=path.read_text() if path.exists() else ''
keys={line.split('=',1)[0]:line.split('=',1)[1].strip() for line in text.splitlines() if '=' in line and not line.startswith('#')}
new=[]
for key in ('DB_PASSWORD','JWT_SECRET','ADMIN_PASSWORD','GRAFANA_ADMIN_PASSWORD','GRAFANA_SECRET_KEY'):
    if not keys.get(key): new.append(key+'='+secrets.token_urlsafe(48 if key=='JWT_SECRET' else 24))
if new:
    path.write_text(text.rstrip()+'\n'+'\n'.join(new)+'\n')
    os.chmod(path,0o600)
print('Environment ready. Secrets are stored in .env; existing values were preserved.')
PY
