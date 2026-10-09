#!/usr/bin/env python3
"""Embed exactly the Android game's source/assets into a portable HTML preview."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
game=ROOT/'game'
html=(game/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>\n'+(game/m[1]).read_text()+'\n</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>\n'+(game/m[1]).read_text().replace('</script','<\\/script')+'\n</script>',html)
(ROOT/'play-preview.html').write_text(html)
print('Built play-preview.html from current game sources')
