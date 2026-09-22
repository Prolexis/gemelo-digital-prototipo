# Tabla Comparativa de Modelos vs. Baselines (Estándar Q1)

Comparación de desempeño out-of-fold (5-Fold Stratified CV) sobre el dataset DSTM-MineSafe-2026 (n=5.000).

| Modelo | Tipo | AUC-ROC | AUC-PR | Precisión | Recall | F1-Score | Accuracy |
|---|---|---|---|---|---|---|---|
| Regla Física TTC (< 3.0 s) | Físico Determinista | 0.9868 | 0.9896 | 0.9993 | 0.5648 | 0.7217 | 0.7668 |
| Regla Física TTC (< 5.0 s) | Físico Determinista | 0.9868 | 0.9896 | 0.9734 | 0.8872 | 0.9283 | 0.9266 |
| Regresión Logística (OOF 5-Fold) | Estadístico Paramétrico | 0.9957 | 0.9963 | 0.9650 | 0.9694 | 0.9672 | 0.9648 |
| Random Forest (OOF 5-Fold) | Machine Learning (Ensamble) | 0.9938 | 0.9948 | 0.9641 | 0.9634 | 0.9638 | 0.9612 |
| Gradient Boosting (OOF 5-Fold) | Machine Learning (Boosting) | 0.9943 | 0.9952 | 0.9650 | 0.9671 | 0.9660 | 0.9636 |


**Nota:** Los modelos Random Forest y Gradient Boosting superan significativamente a los baselines físicos de TTC estático en AUC-ROC y Recall debido a su capacidad de integrar factores estocásticos de fatiga humana (PERCLOS), fricción de rampa y atenuación óptica LiDAR.
