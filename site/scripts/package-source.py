"""Package the local developer project without dependencies or hosting state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
output = root / 'releases/hawker-nearby-source.zip'
output.parent.mkdir(exist_ok=True)
files = [root / name for name in (
    'LICENSE', 'THIRD_PARTY_NOTICES.md', 'README.md', 'AGENTS.md', '.gitignore', '.nvmrc',
    'package.json', 'pnpm-lock.yaml', 'playwright.config.mjs', 'vite.config.js', 'vercel.json', 'index.html',
    'scripts/geocode.py', 'scripts/import-stalls.py', 'scripts/package-source.py',
)]
for directory in ('src', 'public', 'tests'):
    files += sorted(path for path in (root / directory).rglob('*') if path.is_file())
with ZipFile(output, 'w', compression=ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, 'hawker-nearby/' + path.relative_to(root).as_posix())
print(f'{output}: {len(files)} source files')
