#!/usr/bin/env python3
"""Package tracked sources, a Git bundle, and a dependency-free built app."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
output = root / "artifacts"
output.mkdir(exist_ok=True)
if not (root / "dist/index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")
subprocess.run(["git", "diff", "--exit-code"], cwd=root, check=True, capture_output=True)
subprocess.run(["git", "diff", "--cached", "--exit-code"], cwd=root, check=True, capture_output=True)
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
files = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
bundle = output / "spoonworld.git.bundle"
subprocess.run(["git", "bundle", "create", str(bundle), "--all"], cwd=root, check=True)
with zipfile.ZipFile(output / "spoonworld-source.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        if name:
            archive.write(root / name, "spoonworld-source/" + name)
    archive.write(bundle, "spoonworld-source/spoonworld.git.bundle")
with zipfile.ZipFile(output / "spoonworld-portable.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((root / "dist").rglob("*")):
        if file.is_file():
            archive.write(file, "spoonworld-portable/" + str(file.relative_to(root)))
    archive.write(root / "scripts/serve.mjs", "spoonworld-portable/scripts/serve.mjs")
    archive.write(root / "THIRD-PARTY-NOTICES.md", "spoonworld-portable/THIRD-PARTY-NOTICES.md")
    archive.writestr("spoonworld-portable/START-HERE.md", """# Play Spoonworld

This ZIP contains the complete built app. It needs Node.js 22.12+ or 24+;
it does not need npm packages, an API key, or an account.

1. Unzip the archive and open a terminal in the spoonworld-portable folder.
2. Run: node scripts/serve.mjs
3. Open: http://127.0.0.1:4188

If that port is occupied: PORT=4198 node scripts/serve.mjs
then open http://127.0.0.1:4198 instead.

Choose an ingredient, then tap a patch in the bowl. Follow the Field Guide
clues to discover five little wonders. Undo, reset, and seeded worlds let you
experiment freely. Everything saves locally. Export gives you a world backup.

After Offline ready appears, this browser can reload and play without a
connection. Keep the local server running; it serves only this app.

No infrastructure was provisioned. No public release was performed.
""")
artifacts = []
for file in [output / "spoonworld-source.zip", output / "spoonworld-portable.zip", bundle]:
    artifacts.append({"file": str(file), "bytes": file.stat().st_size, "sha256": hashlib.sha256(file.read_bytes()).hexdigest()})
publication = json.loads((root / "evidence/publication-status.json").read_text())
manifest = {"sourceCommit": commit, "githubUrl": publication.get("githubUrl"), "pullRequestUrl": publication.get("pullRequestUrl"), "publicationStatus": publication["status"], "artifacts": artifacts}
(output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest, indent=2))
