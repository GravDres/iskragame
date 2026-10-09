#!/usr/bin/env python3
"""Download only Android build dependencies into the project-local .toolchain."""
from pathlib import Path
import urllib.request
import zipfile
import shutil

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.toolchain'
TOOLS.mkdir(exist_ok=True)

def get(url, name):
    destination = TOOLS / name
    if destination.exists() and destination.stat().st_size > 10000:
        return destination
    print('Downloading', name, flush=True)
    with urllib.request.urlopen(url, timeout=60) as source, destination.open('wb') as target:
        shutil.copyfileobj(source, target)
    return destination

for url, filename, folder in [
    ('https://dl.google.com/android/repository/platform-35_r02.zip', 'platform-35.zip', 'platform'),
    ('https://dl.google.com/android/repository/build-tools_r35_linux.zip', 'build-tools-35.zip', 'buildtools'),
]:
    if not (TOOLS / folder).exists():
        archive = get(url, filename)
        with zipfile.ZipFile(archive) as z:
            top = z.namelist()[0].split('/')[0]
            z.extractall(TOOLS / 'extract')
        shutil.move(str(TOOLS / 'extract' / top), str(TOOLS / folder))
        for path in (TOOLS / folder).rglob('*'):
            if path.is_file() and (path.suffix == '' or path.name in ('apksigner', 'd8')):
                path.chmod(path.stat().st_mode | 0o111)
        archive.unlink()
get('https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.40.0/ecj-3.40.0.jar', 'ecj.jar')
get('https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar', 'json.jar')
print('Toolchain ready:', TOOLS, flush=True)
