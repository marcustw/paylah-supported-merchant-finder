"""Convert the supplied centre/stall tables into postal-code keyed map data."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / 'public/participating-stalls.md'
centres = {}
section_count = row_count = 0
for section in re.split(r'^## ', source.read_text(), flags=re.M)[1:]:
    postal = re.search(r'\*\*Postal code:\*\* (\d{6})', section)
    if not postal:
        continue
    name = section.splitlines()[0].strip()
    rows = []
    for line in section.splitlines():
        if not line.startswith('| ') or line.startswith('| Stall / Merchant'):
            continue
        cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
        if len(cells) != 2:
            raise ValueError(f'Invalid row in {name}: {line}')
        rows.append({'name': cells[0], 'unit': cells[1]})
    count = re.search(r'\*\*Participating merchant listings:\*\* (\d+)', section)
    if not count or len(rows) != int(count[1]):
        raise ValueError(f'Stall count mismatch in {name}')
    centre = centres.setdefault(postal[1], {'names': [], 'stalls': []})
    centre['names'].append(name)
    # A postal code may have multiple sections; preserve every distinct name/unit.
    existing = {(s['name'], s['unit']) for s in centre['stalls']}
    for stall in rows:
        key = (stall['name'], stall['unit'])
        if key not in existing:
            centre['stalls'].append(stall)
            existing.add(key)
    section_count += 1
    row_count += len(rows)
summary = re.search(r'\*\*(\d+) hawker centres; ([\d,]+) distinct merchant listings', source.read_text())
if not summary or section_count != int(summary[1]) or row_count != int(summary[2].replace(',', '')):
    raise ValueError('Source summary does not match the parsed tables')
(root / 'public/stalls.json').write_text(json.dumps(centres, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {row_count} source listings from {section_count} sections into {len(centres)} postal codes.')
