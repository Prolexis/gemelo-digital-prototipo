# FASE X — Auditoría de Referencias, Trazabilidad de DOIs e Integridad Documental (`FON-04`, `FOR-01`, `FOR-02`)

## 1. Estado del Archivo del Manuscrito en el Workspace

De acuerdo con la Fase I y la Regla Absoluta #15 (*"Distinguir siempre entre lo verificado, lo reportado y lo no encontrado"*):
- Los archivos externos del manuscrito editorial (`.docx` / `.pdf`) y del informe del profesor (`Grupo 26`) se registran como **`NO LOCALIZADO`** dentro del directorio del repositorio `gemelo-digital-prototipo`.
- Por consiguiente, esta auditoría verifica exhaustivamente todas las citas, DOIs y estándares presentes en los archivos del repositorio (`experiments/CITATION.cff`, `experiments/data/datasheet.md`, `experiments/README.md`, `README.md`, `DELIVERABLES.md`) y entrega la **guía exacta de verificación y reemplazo línea por línea** para aplicar en el documento Word/LaTeX del artículo antes del reenvío a *Acta Montanistica Slovaca*.

---

## 2. Tabla de Auditoría de Referencias y Metadatos de Citación

| id_ref | tipo | citacion_actual_en_repo | archivos_donde_aparece | hallazgo_auditoria | accion_correctiva_obligatoria | estado |
|---|---|---|---|---|---|---|
| REF-REPO-01 | DOI Zenodo / Software | Sanchez Enriquez, C. A. (2026). Prolexis/gemelo-digital-prototipo: Version1 (v1.0.0). Zenodo. DOI: 10.5281/zenodo.22905230 | experiments/CITATION.cff, README.md, experiments/README.md, DELIVERABLES.md | En CITATION.cff se declara 'type: software' con 'doi: 10.5281/zenodo.22905230', pero el mensaje mezcla software y dataset DSTM-MineSafe-2026. Además, el prefijo 22905230 debe verificarse como registro activo en Zenodo y separarse entre DOI de software y DOI de dataset. | Distinguir explícitamente en Data/Code Availability Statement el repositorio de software (GitHub/Zenodo type: software) frente al archivo de datos DSTM-MineSafe-2026.csv (CC-BY 4.0), verificando resolución activa del DOI antes del envío final. | AUDITADO - REQUIERE ACTUALIZACIÓN EN MANUSCRITO Y CITATION.CFF |
| REF-REPO-02 | Norma Internacional | ISO 21815-1:2022 — Earth-moving machinery — Collision warning and avoidance — Part 1: General requirements | experiments/data/datasheet.md, README.md, experiments/README.md | Referencia normativa correcta y verificada. Se utiliza para acotar el horizonte de detección (0-200 m) y la taxonomía de advertencia de colisión. | Mantener la cita normativa aclarando que los parámetros de penalización de la ecuación de etiquetado son supuestos heurísticos de simulación y no fórmulas prescritas por ISO 21815-1. | VERIFICADO CORRECTO |
| REF-REPO-03 | Regulación de Seguridad Minera | MSHA 30 CFR Part 56 / Part 75 — Safety and Health Standards — Surface Metal and Nonmetal Mines | experiments/data/datasheet.md, README.md | 30 CFR Part 56 aplica correctamente a minería superficial (open-pit); 30 CFR 75.1732 aplica a proximidad en minería subterránea de carbón. | Citar 30 CFR Part 56 para minería a cielo abierto y mencionar 30 CFR 75.1732 únicamente como antecedente regulatorio de sistemas PDS de la MSHA. | VERIFICADO CON ACLARACIÓN DE ALCANCE |
| REF-REPO-04 | Norma de Gestión de Riesgo | ISO 31000:2018 & ISO 17757:2019 (Autonomous machine safety in earth-moving/mining) | experiments/data/datasheet.md | Estándares pertinentes para flotas autónomas AHS (ISO 17757:2019) y gestión de riesgo (ISO 31000). | Conservar en la fundamentación de flotas mixtas (Escenario E). | VERIFICADO CORRECTO |
| REF-MAN-01 | Error Ortográfico de Autor en Manuscrito (FOR-02) | En el manuscrito externo se reporta apellido truncado 'Mohammadia' en lugar de 'Mohammadian' | Manuscrito externo (.docx / .pdf NO LOCALIZADO en workspace) | El informe de revisión académica (FOR-02) detectó la grafía incompleta 'Mohammadia' en las citas en texto y/o lista de referencias. | Buscar y reemplazar todas las ocurrencias de 'Mohammadia' por 'Mohammadian' tanto en las citas en el cuerpo del artículo como en la sección References. | CORRECCIÓNTEXTUAL LISTA PARA APLICAR EN MANUSCRITO |
| REF-MAN-02 | Extracción y Visualización de Páginas 3 y 13 y las 32 Referencias (FOR-01) | Páginas 3 y 13 del PDF/Word del manuscrito y listado de 32 referencias bibliográficas | Manuscrito externo (.docx / .pdf NO LOCALIZADO en workspace) | El archivo .docx/.pdf del manuscrito no se encuentra dentro del árbol de directorios del repositorio Git, por lo que se documenta como NO LOCALIZADO y se entrega protocolo completo de verificación tipográfica y bibliográfica de las 32 referencias. | Verificar en el archivo Word/PDF maestro que las ecuaciones de la pág. 3 usen fuentes embebidas (Cambria Math / LaTeX PDF/A-1b) y que la pág. 13 no tenga saltos de sección corruptos ni referencias truncadas. | PROTOCOLO DE VERIFICACIÓN ENTREGADO |

---

## 3. Resolución de `FON-04`: Trazabilidad entre Software y Dataset en Zenodo (`10.5281/zenodo.22905230`)

En `experiments/CITATION.cff` (líneas 1–13) se declara:
```yaml
cff-version: 1.2.0
message: "If you use this reproducible pipeline or the DSTM-MineSafe-2026 dataset in your research, please cite it as below."
title: "Prolexis/gemelo-digital-prototipo: Version1"
version: "v1.0.0"
doi: "10.5281/zenodo.22905230"
date-released: 2026-09-22
type: software
```
**Problema detectado (`FON-04`):**
1. El archivo `CITATION.cff` define `type: software`, pero el texto del manuscrito y `README.md` utilizan el mismo DOI `10.5281/zenodo.22905230` indistintamente para referirse al código del prototipo y al dataset `DSTM-MineSafe-2026.csv`.
2. **Acción obligatoria para el autor:**
   - Verificar que el registro Zenodo `10.5281/zenodo.22905230` (o el DOI definitivo asignado por Zenodo al publicar el release `v1.0.0`) resuelva públicamente en `https://doi.org/...`.
   - En la sección **Data and Code Availability Statement** del artículo, separar claramente:
     - **Software / Pipeline Reproducible (Licencia MIT):** Repositorio GitHub (`https://github.com/Prolexis/gemelo-digital-prototipo`, tag `v1.0.0`) y archivo de software en Zenodo (`type: software`).
     - **Dataset Sintético `DSTM-MineSafe-2026.csv` ($N = 5,000$, Licencia CC-BY 4.0):** Ruta exacta `experiments/data/DSTM-MineSafe-2026.csv` junto con su ficha técnica `experiments/data/datasheet.md` (y su DOI específico de dataset en Zenodo si se deposita por separado).

---

## 4. Guía de Verificación Manual para el Manuscrito Word/PDF (`FOR-01` y `FOR-02`)

1. **Verificación de las Páginas 3 y 13 (`FOR-01`):**
   - **Página 3 (Formulación matemática y arquitectura):** Comprobar que todas las ecuaciones (definición de $\text{TTC}$, $\text{TTC}_{\text{eff}}$, función de riesgo y descomposición aditiva SHAP $\hat{f}(x) = \phi_0 + \sum_{i=1}^M \phi_i$) estén escritas con el editor nativo de ecuaciones (OMML en Word o entorno `equation`/`align` en LaTeX) y que al exportar a PDF con estándar **PDF/A-1b** no aparezcan cuadros vacíos, glifos truncados ni superposición de texto con diagramas.
   - **Página 13 (Discusión final / Conclusiones / Inicio de Referencias):** Comprobar que no existan saltos de página huérfanos, tablas cortadas fuera de margen ni bloques de texto omitidos por el extractor de PDF.
2. **Corrección ortográfica del autor (`FOR-02`):**
   - Ejecutar búsqueda global (`Ctrl+H`) en el manuscrito de la cadena **`Mohammadia`** (sin `n` final) y reemplazar todas las apariciones por **`Mohammadian`** (tanto en las citas narrativas/parentéticas del texto como en la entrada correspondiente de la lista de referencias).
3. **Verificación cruzada de las 32 referencias bibliográficas (`FOR-01` / `FOR-02`):**
   - Confirmar que las **32 referencias** de la lista final estén numeradas o alfabetizadas según la guía de *Acta Montanistica Slovaca*, que las 32 estén citadas al menos una vez en el cuerpo principal y que ninguna cita en el texto carezca de entrada en la bibliografía.
