#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import json, os, secrets, subprocess, time, urllib.request, urllib.error
base = os.environ.get('SMOKE_BASE_URL', 'http://localhost:3000').rstrip('/')
services = subprocess.check_output(['docker','compose','config','--services'], text=True).split()
deadline=time.monotonic()+180
while True:
    containers = subprocess.check_output(['docker','compose','ps','-a','-q'], text=True).split()
    inspection = json.loads(subprocess.check_output(['docker','inspect',*containers], text=True)) if containers else []
    by_service = {c['Config']['Labels']['com.docker.compose.service']: c for c in inspection}
    pending=[]
    for service in services:
        state=by_service.get(service,{}).get('State',{})
        if state.get('Status') != 'running' or state.get('Health',{}).get('Status') != 'healthy':
            pending.append(service)
    if not pending: break
    if time.monotonic() >= deadline: raise AssertionError('Services not healthy: '+', '.join(pending))
    time.sleep(2)
print('PASS: all Compose services healthy')
def request(path, body=None, token=None, expected=200):
    headers = {'Content-Type':'application/json'}
    if token: headers['Authorization'] = 'Bearer '+token
    req = urllib.request.Request(base+path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            assert response.status == expected, f'{path}: unexpected status {response.status}'
            result = json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == expected: return None
        raise AssertionError(f'{path}: HTTP {error.code}') from error
    assert result['success'], f'{path}: {result.get("error")}'
    return result['data']
username='smoke_'+secrets.token_hex(6); password=secrets.token_urlsafe(24)
request('/api/auth/register', {'username':username,'password':password}, expected=201)
user_token=request('/api/auth/login', {'username':username,'password':password})['token']
request('/api/auth/validate',token=user_token)
request('/api/admin/dashboard',token=user_token,expected=403)
print('PASS: registration, login, token validation and user/admin isolation')
config=json.loads(subprocess.check_output(['docker','compose','config','--format','json'],text=True))
admin_password=config['services']['backend']['environment']['ADMIN_PASSWORD']
admin_token=request('/api/auth/login',{'username':'admin','password':admin_password})['token']
before=request('/api/incidents?size=100'); before_ids={i['id'] for i in before['content']}
heat_before=request('/api/incidents/heatmap')
state='Maharashtra'; before_count=next((i['count'] for i in heat_before if i['stateName']==state),0)
request('/api/admin/ingest/trigger?sourceType=MANUAL&state=Maharashtra',{},admin_token)
for attempt in range(60):
    after=request('/api/incidents?size=100')
    new=[i for i in after['content'] if i['id'] not in before_ids and (i.get('sourceUrl') or '').startswith('https://test.crimelens.in/manual-')]
    heat=request('/api/incidents/heatmap')
    row=next((i for i in heat if i['stateName']==state),None)
    if new and row and row['count'] > before_count and row.get('lat') and row.get('lng'): break
    time.sleep(2)
else: raise AssertionError('Kafka ingestion did not appear in incidents and geolocated heatmap within 120 seconds')
print('PASS: ingestion → Kafka → AI/fallback → database → incidents and heatmap through frontend proxy')
PY
