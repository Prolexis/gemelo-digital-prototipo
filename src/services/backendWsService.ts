import { Equipment, CollisionAlert } from '../types/mining';

type TelemetryCallback = (equipments: Equipment[]) => void;
type AlertCallback = (alert: CollisionAlert) => void;
type AlertsSnapshotCallback = (alerts: CollisionAlert[]) => void;
type StatusCallback = (status: { isConnected: boolean; source: string }) => void;

class BackendWebSocketService {
  private telemetryWs: WebSocket | null = null;
  private alertsWs: WebSocket | null = null;
  
  private telemetryListeners: Set<TelemetryCallback> = new Set();
  private alertListeners: Set<AlertCallback> = new Set();
  private alertsSnapshotListeners: Set<AlertsSnapshotCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();

  private isTelemetryConnected = false;
  private isAlertsConnected = false;
  private reconnectTimer: any = null;
  private shouldReconnect = true;

  private getWsBaseUrl(): string {
    const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    const isHttps = rawApiUrl.startsWith('https') || window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    
    // Si VITE_API_URL tiene host específico (ej: http://localhost:8000)
    try {
      const parsed = new URL(rawApiUrl);
      return `${protocol}//${parsed.host}`;
    } catch {
      return `${protocol}//${window.location.hostname}:8000`;
    }
  }

  public connect(): void {
    this.shouldReconnect = true;
    this.connectTelemetryWs();
    this.connectAlertsWs();
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.telemetryWs) {
      this.telemetryWs.close();
      this.telemetryWs = null;
    }
    if (this.alertsWs) {
      this.alertsWs.close();
      this.alertsWs = null;
    }
    this.isTelemetryConnected = false;
    this.isAlertsConnected = false;
    this.notifyStatus();
  }

  private connectTelemetryWs(): void {
    const baseUrl = this.getWsBaseUrl();
    const url = `${baseUrl}/ws/telemetry`;

    try {
      this.telemetryWs = new WebSocket(url);

      this.telemetryWs.onopen = () => {
        this.isTelemetryConnected = true;
        this.notifyStatus();
      };

      this.telemetryWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.equipments && Array.isArray(data.equipments)) {
            this.telemetryListeners.forEach((cb) => cb(data.equipments));
          }
        } catch (err) {
          console.debug('Error parseando paquete de telemetría WebSocket:', err);
        }
      };

      this.telemetryWs.onclose = () => {
        this.isTelemetryConnected = false;
        this.notifyStatus();
        this.scheduleReconnect();
      };

      this.telemetryWs.onerror = () => {
        this.isTelemetryConnected = false;
        this.notifyStatus();
      };
    } catch {
      this.isTelemetryConnected = false;
      this.scheduleReconnect();
    }
  }

  private connectAlertsWs(): void {
    const baseUrl = this.getWsBaseUrl();
    const url = `${baseUrl}/ws/alerts`;

    try {
      this.alertsWs = new WebSocket(url);

      this.alertsWs.onopen = () => {
        this.isAlertsConnected = true;
        this.notifyStatus();
      };

      this.alertsWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'INITIAL_ALERTS_SNAPSHOT' && Array.isArray(data.alerts)) {
            this.alertsSnapshotListeners.forEach((cb) => cb(data.alerts));
          } else if (data && (data.id || data.alertCode)) {
            this.alertListeners.forEach((cb) => cb(data as CollisionAlert));
          }
        } catch (err) {
          console.debug('Error parseando alerta de WebSocket:', err);
        }
      };

      this.alertsWs.onclose = () => {
        this.isAlertsConnected = false;
        this.notifyStatus();
        this.scheduleReconnect();
      };

      this.alertsWs.onerror = () => {
        this.isAlertsConnected = false;
        this.notifyStatus();
      };
    } catch {
      this.isAlertsConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isTelemetryConnected) this.connectTelemetryWs();
      if (!this.isAlertsConnected) this.connectAlertsWs();
    }, 3000);
  }

  private notifyStatus(): void {
    const isConnected = this.isTelemetryConnected || this.isAlertsConnected;
    const source = isConnected ? 'BACKEND_WEBSOCKET' : 'LOCAL_FALLBACK';
    this.statusListeners.forEach((cb) => cb({ isConnected, source }));
  }

  public subscribeTelemetry(callback: TelemetryCallback): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  public subscribeAlert(callback: AlertCallback): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  public subscribeAlertsSnapshot(callback: AlertsSnapshotCallback): () => void {
    this.alertsSnapshotListeners.add(callback);
    return () => this.alertsSnapshotListeners.delete(callback);
  }

  public subscribeStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback({
      isConnected: this.isTelemetryConnected || this.isAlertsConnected,
      source: (this.isTelemetryConnected || this.isAlertsConnected) ? 'BACKEND_WEBSOCKET' : 'LOCAL_FALLBACK'
    });
    return () => this.statusListeners.delete(callback);
  }

  public async acknowledgeAlert(alertId: string, supervisorName: string): Promise<boolean> {
    const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${rawApiUrl}/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorName, notes: 'Mitigación en rampa confirmada.' })
      });
      return res.ok;
    } catch (e) {
      console.warn('No se pudo enviar reconocimiento al backend:', e);
      return false;
    }
  }
}

export const backendWsService = new BackendWebSocketService();
