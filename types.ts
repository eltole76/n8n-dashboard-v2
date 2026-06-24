/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, any>;
  status?: 'success' | 'failed' | 'idle';
}

export interface N8nConnection {
  [nodeName: string]: {
    main: Array<Array<{
      node: string;
      type: 'main';
      index: number;
    }>>;
  };
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8nNode[];
  connections: N8nConnection;
  triggerType: 'Webhook' | 'Schedule' | 'On Error' | 'Event Trigger' | 'Manual' | 'Chat Trigger' | 'Other';
  stats: {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    avgDurationMs: number;
    lastExecutedAt?: string;
  };
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running' | 'waiting';
  mode: 'trigger' | 'manual' | 'retry' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  durationMs: number;
  errorNodeName?: string;
  errorMessage?: string;
  errorStack?: string;
  dataSizeKb?: number;
  triggerType?: string;
}

export interface N8nError {
  id: string;
  executionId: string;
  workflowId: string;
  workflowName: string;
  nodeName: string;
  nodeType: string;
  message: string;
  stack?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface N8nCredentials {
  url: string;
  apiKey: string;
}

export interface N8nSummaryStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  successRate: number;
  totalErrors: number;
  avgDurationMs: number;
  totalDataSizeKb: number;
}
