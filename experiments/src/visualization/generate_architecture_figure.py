"""
experiments/src/visualization/generate_architecture_figure.py
Genera la Figura 1 del artículo científico:
Arquitectura de microservicios de MineSafe 3D (Capas 1, 2 y 3).
Estándar de calidad Q1: 300 DPI, tipografía limpia, esquema de colores armónico.
"""

from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
OUT_PATH = PROJECT_ROOT / "experiments" / "results" / "fig_architecture.png"

def create_architecture_diagram():
    fig = plt.figure(figsize=(16, 10.5), dpi=300)
    ax = fig.add_subplot(111)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10.5)
    ax.axis("off")

    # Colores temáticos elegantes
    c_fleet = "#f8f9fa"
    c_fleet_border = "#6c757d"
    
    c_layer3 = "#eef4fb"
    c_layer3_border = "#3b82f6"
    
    c_layer2 = "#f0fdf4"
    c_layer2_border = "#10b981"
    
    c_layer1 = "#faf5ff"
    c_layer1_border = "#8b5cf6"

    # ── 1. Capa 0: Telemetría y Flota Minera Mixta ──
    rect_fleet = patches.FancyBboxPatch((0.6, 0.6), 14.8, 1.8,
                                        boxstyle="round,pad=0.15,rounding_size=0.25",
                                        facecolor=c_fleet, edgecolor=c_fleet_border, linewidth=1.5, linestyle="--")
    ax.add_patch(rect_fleet)
    ax.text(0.9, 2.1, "FUENTES SENSORIALES Y FLOTA MIXTA EN TAJO ABIERTO (ENTORNO OPERACIONAL)", 
            fontsize=11, fontweight="bold", color="#374151")

    # Subcajas de flota
    fleet_boxes = [
        (1.0, 0.8, 3.2, 1.1, "CAT 797F (Manual)\n+ Komatsu 930E (AHS)", "Flota Mixta Escenarios A–E", "#ffffff"),
        (4.7, 0.8, 3.2, 1.1, "GNSS-RTK Dual\n(±2 cm, 2 Hz)", "Velocidad y Pendiente rampa", "#ffffff"),
        (8.4, 0.8, 3.2, 1.1, "LiDAR 3D 32/64 Haces\n(ISO 21815-1)", "Distancia proximidad y visibilidad", "#ffffff"),
        (12.1, 0.8, 3.0, 1.1, "Sensorica Cabina e IMU\n(PERCLOS / Jerk)", "Fatiga operador y acelerometría", "#ffffff")
    ]
    for x, y, w, h, title, sub, bg in fleet_boxes:
        r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                   facecolor=bg, edgecolor="#9ca3af", linewidth=1.0)
        ax.add_patch(r)
        ax.text(x + w/2, y + h*0.62, title, fontsize=9.5, fontweight="bold", ha="center", va="center", color="#1f2937")
        ax.text(x + w/2, y + h*0.25, sub, fontsize=8, ha="center", va="center", color="#6b7280", style="italic")

    # Flechas hacia Capa 3
    for x_arr in [2.6, 6.3, 10.0, 13.6]:
        ax.annotate("", xy=(x_arr, 2.8), xytext=(x_arr, 2.45),
                    arrowprops=dict(arrowstyle="-|>", color="#4b5563", lw=1.8, mutation_scale=14))

    # ── 2. Capa 3: Ingesta y Persistencia (Infraestructura) ──
    rect_l3 = patches.FancyBboxPatch((0.6, 2.8), 14.8, 1.8,
                                     boxstyle="round,pad=0.15,rounding_size=0.25",
                                     facecolor=c_layer3, edgecolor=c_layer3_border, linewidth=1.8)
    ax.add_patch(rect_l3)
    ax.text(0.9, 4.3, "CAPA 3: INGESTA, TELEMETRÍA EN TIEMPO REAL Y PERSISTENCIA (DOCKER)", 
            fontsize=11, fontweight="bold", color="#1d4ed8")

    l3_boxes = [
        (1.2, 3.0, 6.5, 1.1, "Redis 7.2 (In-Memory Pub/Sub Telemetry Broker)", 
         "Buffer circular de telemetría a 2 Hz | Latencia < 2 ms", "#ffffff"),
        (8.3, 3.0, 6.8, 1.1, "PostgreSQL 16 + PostGIS (Almacén Geoespacial)", 
         "Persistencia de eventos, trayectorias espaciales y metadatos", "#ffffff")
    ]
    for x, y, w, h, title, sub, bg in l3_boxes:
        r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                   facecolor=bg, edgecolor=c_layer3_border, linewidth=1.2)
        ax.add_patch(r)
        ax.text(x + w/2, y + h*0.62, title, fontsize=10, fontweight="bold", ha="center", va="center", color="#1e3a8a")
        ax.text(x + w/2, y + h*0.25, sub, fontsize=8.5, ha="center", va="center", color="#4b5563")

    # Flechas hacia Capa 2
    for x_arr in [4.45, 11.7]:
        ax.annotate("", xy=(x_arr, 5.0), xytext=(x_arr, 4.65),
                    arrowprops=dict(arrowstyle="-|>", color="#1d4ed8", lw=1.8, mutation_scale=14))

    # ── 3. Capa 2: Motor Físico, Clasificador ML y Explicabilidad (FastAPI) ──
    rect_l2 = patches.FancyBboxPatch((0.6, 5.0), 14.8, 2.5,
                                     boxstyle="round,pad=0.15,rounding_size=0.25",
                                     facecolor=c_layer2, edgecolor=c_layer2_border, linewidth=1.8)
    ax.add_patch(rect_l2)
    ax.text(0.9, 7.2, "CAPA 2: LÓGICA DE NEGOCIO, PREDICCIÓN Y EXPLICABILIDAD (FASTAPI MICROSERVICE)", 
            fontsize=11, fontweight="bold", color="#047857")

    l2_boxes = [
        (1.0, 5.2, 4.2, 1.7, "Motor Físico Cinemático\n(ISO 21815-1)", 
         "• Time-To-Collision (TTC)\n• Distancia crítica euclídea\n• Análisis de aproximación relativa", "#ffffff"),
        (5.5, 5.2, 4.9, 1.7, "Pipeline Machine Learning\n(Random Forest & GBM)", 
         "• Imputer + RobustScaler\n• RF (200 árboles, depth=12)\n• Previsión de colisión (AUC=0.994)", "#ffffff"),
        (10.7, 5.2, 4.4, 1.7, "Motor Explicable XAI\n(TreeSHAP Explainer)", 
         "• Atribución aditiva de variables\n• Ranking global |φᵢ| (Fig. 3)\n• Descomposición local waterfall (Fig. 4)", "#ffffff")
    ]
    for x, y, w, h, title, sub, bg in l2_boxes:
        r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                   facecolor=bg, edgecolor=c_layer2_border, linewidth=1.2)
        ax.add_patch(r)
        ax.text(x + w/2, y + h*0.75, title, fontsize=10, fontweight="bold", ha="center", va="center", color="#065f46")
        ax.text(x + 0.3, y + h*0.35, sub, fontsize=8.5, ha="left", va="center", color="#374151")

    # Flechas internas en Capa 2
    ax.annotate("", xy=(5.5, 6.05), xytext=(5.2, 6.05),
                arrowprops=dict(arrowstyle="-|>", color="#059669", lw=1.5, mutation_scale=12))
    ax.annotate("", xy=(10.7, 6.05), xytext=(10.4, 6.05),
                arrowprops=dict(arrowstyle="-|>", color="#059669", lw=1.5, mutation_scale=12))

    # Flechas hacia Capa 1
    for x_arr in [3.1, 8.0, 12.9]:
        ax.annotate("", xy=(x_arr, 7.9), xytext=(x_arr, 7.55),
                    arrowprops=dict(arrowstyle="-|>", color="#059669", lw=1.8, mutation_scale=14))

    # ── 4. Capa 1: Visualización 3D y Laboratorio Experimental (Frontend) ──
    rect_l1 = patches.FancyBboxPatch((0.6, 7.9), 14.8, 2.0,
                                     boxstyle="round,pad=0.15,rounding_size=0.25",
                                     facecolor=c_layer1, edgecolor=c_layer1_border, linewidth=1.8)
    ax.add_patch(rect_l1)
    ax.text(0.9, 9.6, "CAPA 1: PRESENTACIÓN, GEMELO DIGITAL 3D Y LABORATORIO EXPERIMENTAL", 
            fontsize=11, fontweight="bold", color="#6d28d9")

    l1_boxes = [
        (1.0, 8.1, 4.6, 1.3, "Gemelo Digital 3D (React 18 + Three.js)", 
         "• Escena tridimensional interactiva del pit\n• Renderizado en tiempo real de flotas AHS/manual\n• Semáforo de riesgo y HUD industrial", "#ffffff"),
        (5.9, 8.1, 4.8, 1.3, "CRISP-DM Experimental Lab (Streamlit)", 
         "• Simulación paramétrica de escenarios A–E\n• Benchmarking interactivo de baselines y ROC/PR\n• Visualizador de gráficos TreeSHAP interactivos", "#ffffff"),
        (11.0, 8.1, 4.1, 1.3, "MineSafe Copilot (Gemini LLM)", 
         "• Asistente auxiliar para consulta de protocolos\n• Generación de reportes de auditoría técnica\n• Síntesis explicativa para supervisores", "#ffffff")
    ]
    for x, y, w, h, title, sub, bg in l1_boxes:
        r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                   facecolor=bg, edgecolor=c_layer1_border, linewidth=1.2)
        ax.add_patch(r)
        ax.text(x + w/2, y + h*0.72, title, fontsize=9.8, fontweight="bold", ha="center", va="center", color="#5b21b6")
        ax.text(x + 0.25, y + h*0.32, sub, fontsize=8.2, ha="left", va="center", color="#374151")

    # Contenedor global Docker
    ax.text(14.8, 10.15, "Docker Compose Orchestration", fontsize=9, style="italic", ha="right", color="#6b7280")
    
    plt.tight_layout()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(OUT_PATH, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"[+] Figura 1 generada en: {OUT_PATH}")

if __name__ == "__main__":
    create_architecture_diagram()
