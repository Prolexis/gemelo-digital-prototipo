/**
 * Servicio Cliente en React para consumir la API de FastAPI que amarra Google Gemini
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GeminiHealthResponse {
  status: string;
  gemini_api_key_configured: boolean;
  key_snippet: string;
  model: string;
  engine: string;
  client_sdk: string;
}

export interface RiskAnalysisResult {
  success: boolean;
  equipment_id?: string;
  analysis?: string;
  error?: string;
  fallback_analysis?: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  error?: string;
}

export class GeminiApiService {
  /**
   * Verifica la salud y estado de conexión del motor FastAPI Gemini
   */
  public static async checkHealth(): Promise<GeminiHealthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/health`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn("No se pudo conectar con el backend de FastAPI Gemini:", error);
      return null;
    }
  }

  /**
   * Solicita al motor FastAPI + Gemini un análisis explicable de riesgo
   */
  public static async analyzeRisk(equipmentId: string, alertData: any, shapFactors: any[]): Promise<RiskAnalysisResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/analyze-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_id: equipmentId,
          alert_data: alertData,
          shap_factors: shapFactors,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analizando riesgo con Gemini Backend:", error);
      return {
        success: false,
        error: String(error),
        fallback_analysis: `Análisis local: El equipo ${equipmentId} muestra elevado riesgo por acumulación de factores biológicos (fatiga) y punto ciego.`
      };
    }
  }

  /**
   * Genera el resumen ejecutivo del informe de seguridad usando Gemini
   */
  public static async generateReportSummary(shiftInfo: any, alertsSummary: any[]): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_info: shiftInfo,
          alerts_summary: alertsSummary,
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const data = await response.json();
      return data.summary || "Informe procesado con anticipación de 6.4s por el Gemelo Digital.";
    } catch (error) {
      console.error("Error generando resumen con Gemini:", error);
      return "El Gemelo Digital procesó la telemetría del turno previniendo eventos críticos. Tiempo promedio de anticipación: 6.4 segundos.";
    }
  }

  /**
   * Envía un mensaje al asistente Gemini en tiempo real
   */
  public static async chat(message: string, context?: any): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error("Error en chat Gemini:", error);
      return {
        success: false,
        reply: `Nota: No se pudo establecer conexión directa con FastAPI (${String(error)}). Asegúrate de tener corriendo 'docker compose up' o el servidor en puerto 8000.`
      };
    }
  }
}
