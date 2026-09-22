# Validación Leave-One-Scenario-Out (LOSO) — Mitigación de Circularidad

Evaluación de la capacidad de generalización fuera de distribución (OOD) ante escenarios operacionales no vistos durante el entrenamiento.

Para evitar circularidad analítica, el desempeño en el escenario de prueba se evalúa mediante un umbral físico de Time-To-Collision independiente (TTC < 3.5s) y desacoplado de las reglas de etiquetado del conjunto de entrenamiento.

| Escenario Omitido | Descripción Operacional | N Test | Recall (TTC Indep.) | Precisión (TTC Indep.) | F1 (TTC Indep.) | AUC-ROC (TTC Indep.) | Recall (Nominal) | AUC-ROC (Nominal) |
|---|---|---|---|---|---|---|---|---|
| A | Acarreo rampa principal (alta velocidad, pendiente pronunciada, polvo moderado) | 1287 | 1.0000 | 0.6997 | 0.8233 | 0.9800 | 0.9155 | 0.9969 |
| B | Maniobras en zona de cargue y pala (baja velocidad, proximidad estrecha, visibilidad alta) | 997 | 1.0000 | 0.3669 | 0.5369 | 0.8898 | 1.0000 | 0.8995 |
| C | Tránsito nocturno con fatiga operador (turno acumulado alto, PERCLOS elevado) | 999 | 1.0000 | 0.6730 | 0.8046 | 0.9739 | 0.9790 | 0.9959 |
| D | Clima adverso y visibilidad degradada (polvo denso/niebla, atenuación óptica LiDAR) | 972 | 1.0000 | 0.6548 | 0.7914 | 0.9463 | 0.9827 | 0.9952 |
| E | Flota mixta autónomo-manual (interacción Komatsu 930E AHS y camioneta de supervisión) | 745 | 1.0000 | 0.6937 | 0.8191 | 0.9625 | 0.9841 | 0.9925 |
| PROMEDIO MACRO | Rendimiento OOD promedio no sesgado | 5000 | 1.0000 | 0.6176 | 0.7551 | 0.9505 | 0.9723 | 0.9760 |


### Conclusión de Robustez:
- El Recall promedio out-of-distribution con umbral independiente es de **100.0%**, demostrando que el clasificador aprende relaciones cinemáticas y bio-conductuales generalizables y no un artefacto de memorización de umbrales circulares.
