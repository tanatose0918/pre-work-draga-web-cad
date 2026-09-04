import type { ApiTopologyResponse, ApiPndNode } from '@/types/cad';

function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string) || '';
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && !window.location.hostname.includes('localhost')) {
    return ''; // Gracefully skip localhost on remote HTTPS deployments
  }
  return 'http://localhost:3001/api';
}

export class DragaApiClient {
  static async getTopology(): Promise<ApiTopologyResponse | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const res = await fetch(`${base}/topology`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DragaApiClient] Failed to fetch topology from .NET Web API:', err);
      return null;
    }
  }


  static async getNodes(floor?: string, zone?: string): Promise<{ nodes: ApiPndNode[]; count: number } | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const params = new URLSearchParams();
      if (floor) params.append('floor', floor);
      if (zone) params.append('zone', zone);
      const res = await fetch(`${base}/topology/nodes?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DragaApiClient] Failed to fetch nodes:', err);
      return null;
    }
  }

  static async createNode(node: Partial<ApiPndNode>): Promise<{ status: string; node: ApiPndNode } | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const res = await fetch(`${base}/topology/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[DragaApiClient] Failed to create node:', err);
      return null;
    }
  }

  static async updateNode(tag: string, updates: Partial<ApiPndNode>): Promise<{ status: string; node: ApiPndNode } | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const res = await fetch(`${base}/topology/nodes/${tag}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[DragaApiClient] Failed to update node:', err);
      return null;
    }
  }

  static async deleteNode(tag: string): Promise<boolean> {
    const base = getApiBaseUrl();
    if (!base) return false;
    try {
      const res = await fetch(`${base}/topology/nodes/${tag}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('[DragaApiClient] Failed to delete node:', err);
      return false;
    }
  }

  static async tracePiping(tag: string): Promise<any | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const res = await fetch(`${base}/topology/trace/${tag}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DragaApiClient] Failed to trace piping:', err);
      return null;
    }
  }

  static async getTelemetryHistory(limit = 100, day?: number): Promise<any[] | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (day !== undefined) params.append('day', day.toString());
      const res = await fetch(`${base}/telemetry/history?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DragaApiClient] Failed to fetch history:', err);
      return null;
    }
  }

  static async getTrends(): Promise<any | null> {
    const base = getApiBaseUrl();
    if (!base) return null;
    try {
      const res = await fetch(`${base}/telemetry/trends`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DragaApiClient] Failed to fetch trends:', err);
      return null;
    }
  }
}

