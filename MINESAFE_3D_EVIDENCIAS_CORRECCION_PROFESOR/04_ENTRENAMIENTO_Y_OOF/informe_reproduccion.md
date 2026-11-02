# FASE III (Parte 2) — Reproducción Íntegra del Entrenamiento y Validación OOF (5-Fold Stratified CV)

## 1. Protocolo de Validación Cruzada Verificado

- **Particionado:** `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` (1,000 muestras exactas de validación por fold; 0 solapamiento entre entrenamiento y validación).
- **Preprocesamiento dentro de cada fold (sin fuga de datos):** `SimpleImputer(strategy="median")` + `RobustScaler()`.
- **Semilla de los clasificadores por fold:** `random_state = 42 + fold` (`42, 43, 44, 45, 46`), tal como está implementado en `experiments/src/models/train.py` (líneas 132 y 138).

## 2. Resumen Global Out-of-Fold ($N = 5,000$) y Baselines Comparativos

| modelo | roc_auc_6dec | roc_auc_4dec | roc_auc_ic95_bootstrap | pr_auc_6dec | pr_auc_4dec | precision_6dec | precision_4dec | recall_6dec | recall_4dec | recall_ic95_bootstrap | f1_6dec | f1_4dec | f1_ic95_bootstrap | specificity_6dec | specificity_4dec | accuracy_6dec | accuracy_4dec | tp | fp | tn | fn |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Random Forest (OOF 5-Fold, n_est=200) | 0.993844 | 0.9938 | [0.9926, 0.9950] | 0.994757 | 0.9948 | 0.964112 | 0.9641 | 0.963392 | 0.9634 | [0.9558, 0.9706] | 0.963752 | 0.9638 | [0.9586, 0.9688] | 0.958674 | 0.9587 | 0.9612 | 0.9612 | 2579 | 96 | 2227 | 98 |
| Gradient Boosting (OOF 5-Fold, n_est=150) | 0.994251 | 0.9943 | [0.9929, 0.9955] | 0.995242 | 0.9952 | 0.964965 | 0.965 | 0.967127 | 0.9671 | [0.9604, 0.9733] | 0.966045 | 0.966 | [0.9612, 0.9706] | 0.959535 | 0.9595 | 0.9636 | 0.9636 | 2589 | 94 | 2229 | 88 |
| Regresión Logística (OOF 5-Fold, C=1.0) | 0.995651 | 0.9957 | [0.9947, 0.9965] | 0.996316 | 0.9963 | 0.965043 | 0.965 | 0.969369 | 0.9694 | [0.9629, 0.9760] | 0.967201 | 0.9672 | [0.9623, 0.9722] | 0.959535 | 0.9595 | 0.9648 | 0.9648 | 2595 | 94 | 2229 | 82 |
| Regla Física Determinista TTC < 3.0s | 0.986783 | 0.9868 | Determinista | 0.989572 | 0.9896 | 0.999339 | 0.9993 | 0.564811 | 0.5648 | Determinista | 0.721718 | 0.7217 | Determinista | 0.99957 | 0.9996 | 0.7668 | 0.7668 | 1512 | 1 | 2322 | 1165 |
| Regla Física Determinista TTC < 3.5s | 0.986783 | 0.9868 | Determinista | 0.989572 | 0.9896 | 0.998319 | 0.9983 | 0.665671 | 0.6657 | Determinista | 0.798745 | 0.7987 | Determinista | 0.998709 | 0.9987 | 0.8204 | 0.8204 | 1782 | 3 | 2320 | 895 |
| Regla Física Determinista TTC < 4.0s | 0.986783 | 0.9868 | Determinista | 0.989572 | 0.9896 | 0.9946 | 0.9946 | 0.756817 | 0.7568 | Determinista | 0.859567 | 0.8596 | Determinista | 0.995265 | 0.9953 | 0.8676 | 0.8676 | 2026 | 11 | 2312 | 651 |
| Regla Física Determinista TTC < 5.0s | 0.986783 | 0.9868 | Determinista | 0.989572 | 0.9896 | 0.973361 | 0.9734 | 0.887187 | 0.8872 | Determinista | 0.928278 | 0.9283 | Determinista | 0.972019 | 0.972 | 0.9266 | 0.9266 | 2375 | 65 | 2258 | 302 |

## 3. Desglose por Partición (Folds 1 a 5, Media y Desviación Estándar)

| modelo | fold | n_muestras | roc_auc | pr_auc | precision | recall | f1 | specificity | accuracy | tp | fp | tn | fn |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Random Forest (n_estimators=200) | Fold 1 | 1000 | 0.993362 | 0.994224 | 0.960821 | 0.960821 | 0.960821 | 0.954741 | 0.958 | 515 | 21 | 443 | 21 |
| Random Forest (n_estimators=200) | Fold 2 | 1000 | 0.992976 | 0.994155 | 0.958879 | 0.95709 | 0.957983 | 0.952586 | 0.955 | 513 | 22 | 442 | 23 |
| Random Forest (n_estimators=200) | Fold 3 | 1000 | 0.995466 | 0.996047 | 0.979206 | 0.968224 | 0.973684 | 0.976344 | 0.972 | 518 | 11 | 454 | 17 |
| Random Forest (n_estimators=200) | Fold 4 | 1000 | 0.994453 | 0.995259 | 0.964684 | 0.970093 | 0.967381 | 0.95914 | 0.965 | 519 | 19 | 446 | 16 |
| Random Forest (n_estimators=200) | Fold 5 | 1000 | 0.993022 | 0.994269 | 0.957169 | 0.960748 | 0.958955 | 0.950538 | 0.956 | 514 | 23 | 442 | 21 |
| Random Forest (n_estimators=200) | MEDIA_5_FOLDS | 5000 | 0.993856 | 0.994791 | 0.964152 | 0.963395 | 0.963765 | 0.95867 | 0.9612 | 2579 | 96 | 2227 | 98 |
| Random Forest (n_estimators=200) | DE_5_FOLDS | 5000 | 0.00108 | 0.000836 | 0.008868 | 0.005513 | 0.006646 | 0.010382 | 0.00719 | 0 | 0 | 0 | 0 |
| Gradient Boosting (n_estimators=150) | Fold 1 | 1000 | 0.992565 | 0.994413 | 0.966355 | 0.964552 | 0.965453 | 0.961207 | 0.963 | 517 | 18 | 446 | 19 |
| Gradient Boosting (n_estimators=150) | Fold 2 | 1000 | 0.993868 | 0.994842 | 0.968105 | 0.962687 | 0.965388 | 0.963362 | 0.963 | 516 | 17 | 447 | 20 |
| Gradient Boosting (n_estimators=150) | Fold 3 | 1000 | 0.996021 | 0.996497 | 0.973585 | 0.964486 | 0.969014 | 0.969892 | 0.967 | 516 | 14 | 451 | 19 |
| Gradient Boosting (n_estimators=150) | Fold 4 | 1000 | 0.994264 | 0.995035 | 0.963031 | 0.973832 | 0.968401 | 0.956989 | 0.966 | 521 | 20 | 445 | 14 |
| Gradient Boosting (n_estimators=150) | Fold 5 | 1000 | 0.994606 | 0.99554 | 0.954044 | 0.970093 | 0.962002 | 0.946237 | 0.959 | 519 | 25 | 440 | 16 |
| Gradient Boosting (n_estimators=150) | MEDIA_5_FOLDS | 5000 | 0.994265 | 0.995265 | 0.965024 | 0.96713 | 0.966052 | 0.959537 | 0.9636 | 2589 | 94 | 2229 | 88 |
| Gradient Boosting (n_estimators=150) | DE_5_FOLDS | 5000 | 0.001249 | 0.000798 | 0.00723 | 0.004666 | 0.002806 | 0.008776 | 0.00313 | 0 | 0 | 0 | 0 |
| Regresión Logística (C=1.0, balanced) | Fold 1 | 1000 | 0.995288 | 0.995997 | 0.957721 | 0.972015 | 0.964815 | 0.950431 | 0.962 | 521 | 23 | 441 | 15 |
| Regresión Logística (C=1.0, balanced) | Fold 2 | 1000 | 0.994644 | 0.995525 | 0.968284 | 0.968284 | 0.968284 | 0.963362 | 0.966 | 519 | 17 | 447 | 17 |
| Regresión Logística (C=1.0, balanced) | Fold 3 | 1000 | 0.997054 | 0.99742 | 0.973734 | 0.970093 | 0.97191 | 0.969892 | 0.97 | 519 | 14 | 451 | 16 |
| Regresión Logística (C=1.0, balanced) | Fold 4 | 1000 | 0.995936 | 0.996583 | 0.959559 | 0.975701 | 0.967563 | 0.952688 | 0.965 | 522 | 22 | 443 | 13 |
| Regresión Logística (C=1.0, balanced) | Fold 5 | 1000 | 0.99506 | 0.995879 | 0.966165 | 0.960748 | 0.963449 | 0.96129 | 0.961 | 514 | 18 | 447 | 21 |
| Regresión Logística (C=1.0, balanced) | MEDIA_5_FOLDS | 5000 | 0.995596 | 0.996281 | 0.965092 | 0.969368 | 0.967204 | 0.959533 | 0.9648 | 2595 | 94 | 2229 | 82 |
| Regresión Logística (C=1.0, balanced) | DE_5_FOLDS | 5000 | 0.000939 | 0.000742 | 0.006538 | 0.005548 | 0.003288 | 0.007981 | 0.003564 | 0 | 0 | 0 | 0 |

## 4. Matrices de Confusión Verificadas

| modelo | ambito | n_total | tp | fp | tn | fn | aciertos_totales | errores_totales |
|---|---|---|---|---|---|---|---|---|
| Random Forest (n_estimators=200) | Fold 1 | 1000 | 515 | 21 | 443 | 21 | 958 | 42 |
| Random Forest (n_estimators=200) | Fold 2 | 1000 | 513 | 22 | 442 | 23 | 955 | 45 |
| Random Forest (n_estimators=200) | Fold 3 | 1000 | 518 | 11 | 454 | 17 | 972 | 28 |
| Random Forest (n_estimators=200) | Fold 4 | 1000 | 519 | 19 | 446 | 16 | 965 | 35 |
| Random Forest (n_estimators=200) | Fold 5 | 1000 | 514 | 23 | 442 | 21 | 956 | 44 |
| Random Forest (n_estimators=200) | GLOBAL_OOF_5000 | 5000 | 2579 | 96 | 2227 | 98 | 4806 | 194 |
| Gradient Boosting (n_estimators=150) | Fold 1 | 1000 | 517 | 18 | 446 | 19 | 963 | 37 |
| Gradient Boosting (n_estimators=150) | Fold 2 | 1000 | 516 | 17 | 447 | 20 | 963 | 37 |
| Gradient Boosting (n_estimators=150) | Fold 3 | 1000 | 516 | 14 | 451 | 19 | 967 | 33 |
| Gradient Boosting (n_estimators=150) | Fold 4 | 1000 | 521 | 20 | 445 | 14 | 966 | 34 |
| Gradient Boosting (n_estimators=150) | Fold 5 | 1000 | 519 | 25 | 440 | 16 | 959 | 41 |
| Gradient Boosting (n_estimators=150) | GLOBAL_OOF_5000 | 5000 | 2589 | 94 | 2229 | 88 | 4818 | 182 |
| Regresión Logística (C=1.0, balanced) | Fold 1 | 1000 | 521 | 23 | 441 | 15 | 962 | 38 |
| Regresión Logística (C=1.0, balanced) | Fold 2 | 1000 | 519 | 17 | 447 | 17 | 966 | 34 |
| Regresión Logística (C=1.0, balanced) | Fold 3 | 1000 | 519 | 14 | 451 | 16 | 970 | 30 |
| Regresión Logística (C=1.0, balanced) | Fold 4 | 1000 | 522 | 22 | 443 | 13 | 965 | 35 |
| Regresión Logística (C=1.0, balanced) | Fold 5 | 1000 | 514 | 18 | 447 | 21 | 961 | 39 |
| Regresión Logística (C=1.0, balanced) | GLOBAL_OOF_5000 | 5000 | 2595 | 94 | 2229 | 82 | 4824 | 176 |
| Regla Física Determinista TTC < 3.0s | GLOBAL_5000 | 5000 | 1512 | 1 | 2322 | 1165 | 3834 | 1166 |
| Regla Física Determinista TTC < 3.5s | GLOBAL_5000 | 5000 | 1782 | 3 | 2320 | 895 | 4102 | 898 |
| Regla Física Determinista TTC < 4.0s | GLOBAL_5000 | 5000 | 2026 | 11 | 2312 | 651 | 4338 | 662 |
| Regla Física Determinista TTC < 5.0s | GLOBAL_5000 | 5000 | 2375 | 65 | 2258 | 302 | 4633 | 367 |
