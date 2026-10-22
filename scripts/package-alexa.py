"""Package the canonical planner and Alexa adapter for the existing Lambda."""
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'dist/Guardian_Lambda_Upgrade.zip'
output.parent.mkdir(parents=True, exist_ok=True)
core = (root / 'src/guardian-core.mjs').read_text()
adapter = (root / 'alexa/lambda.mjs').read_text()
import_line = "import { buildGuardianPlan, judgeScenario } from '../src/guardian-core.mjs';\n"
assert adapter.startswith(import_line), 'Review the adapter import before packaging'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('index.mjs', core + '\n' + adapter.removeprefix(import_line))
    archive.write(root / 'alexa/interaction-model.json', 'interaction-model.json')
    archive.write(root / 'alexa/README.md', 'DEPLOY_NOTES.txt')
print(output)
