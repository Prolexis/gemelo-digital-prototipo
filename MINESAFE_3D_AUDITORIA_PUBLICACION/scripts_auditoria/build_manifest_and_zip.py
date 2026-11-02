import csv
import hashlib
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
AUDIT_DIR = PROJECT_ROOT / "MINESAFE_3D_AUDITORIA_PUBLICACION"
MANIFEST_PATH = AUDIT_DIR / "11_MANIFIESTO_EVIDENCIAS.csv"
ZIP_PATH = PROJECT_ROOT / "MINESAFE_3D_EVIDENCIAS_PARA_CHATGPT.zip"

RELEVANT_REPO_PATHS = [
    "README.md",
    "AUDITORIA.md",
    "MISMATCH_REPORT.md",
    "DELIVERABLES.md",
    "docker-compose.yml",
    "package.json",
    ".github/workflows/reproduce.yml",
    "experiments/README.md",
    "experiments/CITATION.cff",
    "experiments/requirements.txt",
    "experiments/requirements.lock",
    "experiments/run_all.py",
    "experiments/config/config.yaml",
    "experiments/data/DSTM-MineSafe-2026.csv",
    "experiments/data/REAL_FIELD_BENCHMARK_2026.csv",
    "experiments/src/data/generate_dataset.py",
    "experiments/src/data/generate_real_dataset.js",
    "experiments/src/data/ingest_real_telemetry.py",
    "experiments/src/models/train.py",
    "experiments/src/models/baselines.py",
    "experiments/src/validation/leave_scenario_out.py",
    "experiments/src/robustness/noise_pilot.py",
    "experiments/src/stats/inferential_tests.py",
    "experiments/src/xai/shap_analysis.py",
    "experiments/results/cv_metrics_summary.json",
    "experiments/results/baselines_comparison.md",
    "experiments/results/loso_validation.csv",
    "experiments/results/loso_validation.md",
    "experiments/results/robustness_noise.csv",
    "experiments/results/robustness_loso_noise.csv",
    "experiments/results/robustness_report.md",
    "experiments/results/statistical_tests.md",
    "experiments/results/shap_values.csv",
    "experiments/results/latency_benchmark.md",
    "experiments/results/figures/fig1_roc_pr_curves.png",
    "experiments/results/figures/fig2_confusion_matrices.png",
    "experiments/results/figures/fig3_loso_performance.png",
    "experiments/results/figures/fig4_shap_summary.png",
    "experiments/results/figures/fig5_shap_bar.png",
    "experiments/results/figures/fig6_robustness_degradation.png",
    "crisp-dm-lab/app.py",
    "crisp-dm-lab/data_loader.py",
    "crisp-dm-lab/data_generator.py",
    "crisp-dm-lab/ml_model.py",
    "crisp-dm-lab/evaluation.py",
    "crisp-dm-lab/risk_engine.py",
    "crisp-dm-lab/statistical_engine.py",
    "crisp-dm-lab/models/pipeline_metadata.json",
    "crisp-dm-lab/models/rf_model.pkl",
    "crisp-dm-lab/models/gb_model.pkl",
    "backend/main.py",
    "backend/requirements.txt",
    "backend/app/services/ml_model_service.py",
    "backend/app/services/risk_engine_service.py",
    "backend/app/services/simulator_service.py",
    "backend/app/services/langflow_service.py",
    "backend/app/services/gemini_service.py",
    "backend/app/services/redis_service.py",
    "src/components/3d/Mine3DViewer.tsx",
    "src/services/riskEngine.ts",
]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    rows = []

    # 1. Archivos generados en MINESAFE_3D_AUDITORIA_PUBLICACION (excepto 11_MANIFIESTO_EVIDENCIAS.csv primero)
    audit_files = sorted([p for p in AUDIT_DIR.rglob("*") if p.is_file() and p.name != "11_MANIFIESTO_EVIDENCIAS.csv"])
    for p in audit_files:
        rel = p.relative_to(PROJECT_ROOT).as_posix()
        st = p.stat()
        mtime = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        rows.append({
            "grupo": "PAQUETE_AUDITORIA_NUEVO",
            "ruta_relativa": rel,
            "tamano_bytes": st.st_size,
            "fecha_modificacion_utc": mtime,
            "sha256": sha256_file(p),
        })

    # 2. Archivos relevantes del repositorio original
    for rel_str in RELEVANT_REPO_PATHS:
        p = PROJECT_ROOT / rel_str
        if p.exists() and p.is_file():
            st = p.stat()
            mtime = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            rows.append({
                "grupo": "REPOSITORIO_ORIGINAL",
                "ruta_relativa": rel_str,
                "tamano_bytes": st.st_size,
                "fecha_modificacion_utc": mtime,
                "sha256": sha256_file(p),
            })

    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["grupo", "ruta_relativa", "tamano_bytes", "fecha_modificacion_utc", "sha256"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"[+] Generado 11_MANIFIESTO_EVIDENCIAS.csv con {len(rows)} archivos verificados.")

    # 3. Empaquetar en MINESAFE_3D_EVIDENCIAS_PARA_CHATGPT.zip
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(AUDIT_DIR.rglob("*")):
            if p.is_file():
                arcname = p.relative_to(PROJECT_ROOT).as_posix()
                zf.write(p, arcname=arcname)

    zip_stat = ZIP_PATH.stat()
    zip_sha = sha256_file(ZIP_PATH)
    print(f"[+] Generado {ZIP_PATH.name} ({zip_stat.st_size} bytes, SHA-256={zip_sha})")


if __name__ == "__main__":
    main()

