import csv
import hashlib
import zipfile
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FINAL_DIR = PROJECT_ROOT / "MINESAFE_EVIDENCIAS_FINALES"
MANIFEST_CSV = FINAL_DIR / "manifiesto_sha256.csv"
ZIP_FINAL = PROJECT_ROOT / "MINESAFE_EVIDENCIAS_FINALES.zip"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    rows = []
    for p in sorted(FINAL_DIR.rglob("*")):
        if p.is_file() and p.name != "manifiesto_sha256.csv":
            rel = p.relative_to(PROJECT_ROOT).as_posix()
            st = p.stat()
            mtime = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            rows.append({
                "ruta_relativa": rel,
                "tamano_bytes": st.st_size,
                "fecha_utc": mtime,
                "sha256": sha256_file(p),
            })

    with open(MANIFEST_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ruta_relativa", "tamano_bytes", "fecha_utc", "sha256"])
        w.writeheader()
        w.writerows(rows)

    if ZIP_FINAL.exists():
        ZIP_FINAL.unlink()

    with zipfile.ZipFile(ZIP_FINAL, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(FINAL_DIR.rglob("*")):
            if p.is_file():
                zf.write(p, arcname=p.relative_to(PROJECT_ROOT).as_posix())

    st_z = ZIP_FINAL.stat()
    print(f"[+] Manifiesto generado: {MANIFEST_CSV.name} ({len(rows)} archivos)")
    print(f"[+] ZIP final generado: {ZIP_FINAL} ({st_z.st_size} bytes, SHA-256={sha256_file(ZIP_FINAL)})")


if __name__ == "__main__":
    main()

