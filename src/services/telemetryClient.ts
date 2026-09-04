export interface TelemetrySensorItem {
  tag: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp?: number;
}

export interface TelemetryBatchMessage {
  event: 'TELEMETRY_BATCH';
  sequenceId: number;
  timestamp: number;
  facilityCode: string;
  simState?: {
    currentLoadPct: number;
    ambientTempC: number;
    pumpSpeedRpm: number;
  };
  data: TelemetrySensorItem[];
}

export interface CommandAckMessage {
  event: 'COMMAND_ACK';
  commandId: string;
  status: string;
  timestamp: number;
  appliedValue: number;
  target?: string;
  parameter?: string;
}

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'FALLBACK_LOCAL';

export class TelemetryWebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private onBatchCallback?: (batch: TelemetryBatchMessage) => void;
  private onAckCallback?: (ack: CommandAckMessage) => void;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;
  public status: ConnectionStatus = 'DISCONNECTED';

  constructor(url?: string) {
    this.url = url || (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:3001/ws/telemetry';
  }


  public connect(
    onBatch?: (batch: TelemetryBatchMessage) => void,
    onAck?: (ack: CommandAckMessage) => void,
    onStatusChange?: (status: ConnectionStatus) => void
  ) {
    this.onBatchCallback = onBatch;
    this.onAckCallback = onAck;
    this.onStatusChangeCallback = onStatusChange;

    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'TELEMETRY_BATCH' && this.onBatchCallback) {
            this.onBatchCallback(msg);
          } else if (msg.event === 'COMMAND_ACK' && this.onAckCallback) {
            this.onAckCallback(msg);
          }
        } catch (e) {
          console.error('[WS Error] Failed to parse message', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('FALLBACK_LOCAL');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('FALLBACK_LOCAL');
      };
    } catch {
      this.setStatus('FALLBACK_LOCAL');
      this.scheduleReconnect();
    }
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(newStatus);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.onBatchCallback, this.onAckCallback, this.onStatusChangeCallback);
    }, 4000);
  }

  public sendOverride(target: string, parameter: string, value: number, operatorId = 'user_tor_01'): string {
    const commandId = `cmd_${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      action: 'OPERATOR_OVERRIDE',
      commandId,
      timestamp: Date.now(),
      target,
      parameter,
      value,
      operatorId
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    return commandId;
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}
