import json
from pathlib import Path
from datetime import datetime, timezone

base = Path("data/respostas")

out_root = Path("data/consolidado.json")
out_docs = Path("docs/data/consolidado.json")

out_root.parent.mkdir(parents=True, exist_ok=True)
out_docs.parent.mkdir(parents=True, exist_ok=True)

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
    "gerado_em": datetime.now(timezone.utc).isoformat(),
    "total_respostas": len(respostas),
    "respostas": respostas
}

for out in [out_root, out_docs]:
    with out.open("w", encoding="utf-8") as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)

print(f"Consolidado gerado com {len(respostas)} respostas.")
print(f"Atualizado: {out_root}")
print(f"Atualizado: {out_docs}")
