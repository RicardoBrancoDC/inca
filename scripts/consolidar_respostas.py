import json
from pathlib import Path
from datetime import datetime

base = Path("data/respostas")
out = Path("data/consolidado.json")
out.parent.mkdir(parents=True, exist_ok=True)

respostas = []
for path in sorted(base.glob("*.json")):
    try:
        with path.open("r", encoding="utf-8") as f:
            item = json.load(f)
            item["_arquivo"] = str(path)
            respostas.append(item)
    except Exception as e:
        print(f"Erro lendo {path}: {e}")

consolidado = {
    "gerado_em": datetime.utcnow().isoformat() + "Z",
    "total_respostas": len(respostas),
    "respostas": respostas
}

with out.open("w", encoding="utf-8") as f:
    json.dump(consolidado, f, ensure_ascii=False, indent=2)

print(f"Consolidado gerado com {len(respostas)} respostas.")
