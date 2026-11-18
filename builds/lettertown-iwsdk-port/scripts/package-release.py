"""Package the complete production site for ordinary static HTTPS hosting."""
import argparse, hashlib, json, subprocess, zipfile
from datetime import datetime, timezone
from pathlib import Path
root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path)
args = parser.parse_args()
sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
html = (root / 'dist/index.html').read_text()
if sha[:12] not in html or '-worktree' in html:
    raise SystemExit('Build the clean committed source before packaging; build identifier does not match HEAD.')
output = args.output or root / 'release' / ('Letter-Town-IWSDK-' + sha[:12] + '.zip')
output.parent.mkdir(parents=True, exist_ok=True)
upstream = json.loads((root / 'source-current.json').read_text())
instructions = f'''LETTER TOWN IWSDK — COMPLETE HOSTING BUILD
Build: {sha}

1. Extract this ZIP. index.html is at its root.
2. Upload ALL extracted files and folders to your hosting site's web directory.
   Keep assets/ and releases/ beside index.html. Do not upload only index.html.
3. Open the hosted page over HTTPS in Meta Quest Browser.
4. Confirm the banner says Letter Town IWSDK — Build {sha[:12]}.
5. Enter VR with hand tracking enabled. Use Settings to adjust/recenter.

No npm install, build command, backend, API key, or ChatGPT/Sites login is required.
This archive is a standalone static website. Your hosting service supplies HTTPS.
If the old version appears, refresh or use ?build={sha[:12]}; do not clear site storage.
Existing saves are retained on the same browser origin. A different hostname has separate saves.

Automated Chromium and XR-emulator testing is separate from physical Quest testing.
Physical Quest completion/performance remains NOT VERIFIED. Do not treat this as competition certification.
'''
files = sorted(p for p in (root / 'dist').rglob('*') if p.is_file())
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.write(path, path.relative_to(root / 'dist').as_posix())
    archive.writestr('UPLOAD-INSTRUCTIONS.txt', instructions)
    archive.writestr('BUILD-INFO.json', json.dumps({'commit': sha, 'upstream_commit': upstream['commit'], 'additional_sources': upstream.get('additional_code_sources', []), 'built_at_utc': datetime.now(timezone.utc).isoformat(), 'physical_quest_tested': False}, indent=2))
with zipfile.ZipFile(output) as archive:
    assert 'index.html' in archive.namelist()
    assert all(not name.startswith('/') and '..' not in Path(name).parts for name in archive.namelist())
    bad = archive.testzip()
    if bad: raise SystemExit('ZIP integrity failed: ' + bad)
checksum = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(checksum + '  ' + output.name + '\n')
print(json.dumps({'zip': str(output.resolve()), 'sha256': checksum, 'bytes': output.stat().st_size, 'site_files': len(files), 'build_commit': sha}, indent=2))
