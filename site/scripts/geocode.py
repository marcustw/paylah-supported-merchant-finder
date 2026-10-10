import json, pathlib, urllib.request, time
root=pathlib.Path(__file__).resolve().parents[1]
rows=[]
for line in (root/'public/supported-hawkers.md').read_text().splitlines()[2:]:
    name,address,postal=[x.strip() for x in line.strip('|').split('|')]
    rows.append(dict(id=postal,name=name,address=address,postal=postal))
out=root/'public/vendors.json'
cache={v['id']:v for v in json.loads(out.read_text())} if out.exists() else {}
for v in rows:
    if v['id'] in cache: continue
    url='https://www.onemap.gov.sg/api/common/elastic/search?searchVal='+v['postal']+'&returnGeom=Y&getAddrDetails=Y&pageNum=1'
    try:
        data=json.load(urllib.request.urlopen(url,timeout=20))
        matches=[x for x in data['results'] if x['POSTAL']==v['postal']]
        if not matches: print('MISSING',v,flush=True); continue
        r=matches[0]
        v.update(lat=float(r['LATITUDE']),lng=float(r['LONGITUDE']),coordinateSource=url,geocodedAddress=r['ADDRESS'])
        cache[v['id']]=v
        out.write_text(json.dumps(list(cache.values()),indent=2))
        print(len(cache),v['name'],flush=True)
    except Exception as e: print('ERROR',v['name'],str(e),flush=True)
    time.sleep(1.5)
print('COMPLETE',len(cache),'/',len(rows))

if len(cache) != len(rows): raise SystemExit('Some coordinates unresolved. Retry after checking lookup errors.')
