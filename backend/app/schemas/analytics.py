from typing import List, Dict, Any
from pydantic import BaseModel

class KPISummaryResponse(BaseModel):
    early_warning_anticipation_seconds: float = 6.4
    pds_standard_anticipation_seconds: float = 1.8
    delta_improvement_percentage: float = 255.5
    auc_roc_score: float = 0.942
    false_positive_rate_reduction_percentage: float = 80.1
    mitigated_near_misses_count: int = 142
    mitigation_effectiveness_percentage: float = 100.0
    active_fleet_count: int = 5
    critical_alerts_last_24h: int = 3
    operator_consent_rate_percentage: float = 100.0
    telemetry_latency_ms: float = 18.5
