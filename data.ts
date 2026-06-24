/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { N8nWorkflow, N8nExecution, N8nError, N8nSummaryStats } from './types';

// Define workflows with their node details and connections for visual flow drawing
export const MOCK_WORKFLOWS: N8nWorkflow[] = [
  {
    id: 'wf-lead-enrich',
    name: 'Lead Generation & CRM Sync (HubSpot)',
    active: true,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
    triggerType: 'Webhook',
    nodes: [
      { id: 'n1', name: 'Contact Form Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [100, 200], status: 'success' },
      { id: 'n2', name: 'Email Verification', type: 'n8n-nodes-base.httpRequest', typeVersion: 2, position: [300, 200], status: 'success' },
      { id: 'n3', name: 'Clearbit Enrichment', type: 'n8n-nodes-base.clearbit', typeVersion: 1, position: [500, 200], status: 'success' },
      { id: 'n4', name: 'HubSpot CRM Integration', type: 'n8n-nodes-base.hubspot', typeVersion: 1, position: [700, 200], status: 'success' },
      { id: 'n5', name: 'Slack Alert Lead Channel', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [900, 200], status: 'success' }
    ],
    connections: {
      'Contact Form Webhook': { main: [[{ node: 'Email Verification', type: 'main', index: 0 }]] },
      'Email Verification': { main: [[{ node: 'Clearbit Enrichment', type: 'main', index: 0 }]] },
      'Clearbit Enrichment': { main: [[{ node: 'HubSpot CRM Integration', type: 'main', index: 0 }]] },
      'HubSpot CRM Integration': { main: [[{ node: 'Slack Alert Lead Channel', type: 'main', index: 0 }]] }
    },
    stats: {
      totalExecutions: 1420,
      successCount: 1392,
      failureCount: 28,
      avgDurationMs: 1450,
      lastExecutedAt: '2026-06-23T17:15:00Z'
    }
  },
  {
    id: 'wf-financial-reconcile',
    name: 'Daily Financial Reconciliator',
    active: true,
    createdAt: '2026-02-15T08:30:00Z',
    updatedAt: '2026-05-10T11:00:00Z',
    triggerType: 'Schedule',
    nodes: [
      { id: 'n1', name: 'Everyday at 6:00 AM', type: 'n8n-nodes-base.cron', typeVersion: 1, position: [100, 250], status: 'success' },
      { id: 'n2', name: 'Stripe API Charges', type: 'n8n-nodes-base.stripe', typeVersion: 1, position: [300, 250], status: 'success' },
      { id: 'n3', name: 'QuickBooks Invoices', type: 'n8n-nodes-base.quickbooks', typeVersion: 1, position: [500, 250], status: 'failed' },
      { id: 'n4', name: 'Postgres Records Sync', type: 'n8n-nodes-base.postgres', typeVersion: 2, position: [700, 250], status: 'idle' },
      { id: 'n5', name: 'Email Audit PDF', type: 'n8n-nodes-base.gmail', typeVersion: 2, position: [900, 250], status: 'idle' }
    ],
    connections: {
      'Everyday at 6:00 AM': { main: [[{ node: 'Stripe API Charges', type: 'main', index: 0 }]] },
      'Stripe API Charges': { main: [[{ node: 'QuickBooks Invoices', type: 'main', index: 0 }]] },
      'QuickBooks Invoices': { main: [[{ node: 'Postgres Records Sync', type: 'main', index: 0 }]] },
      'Postgres Records Sync': { main: [[{ node: 'Email Audit PDF', type: 'main', index: 0 }]] }
    },
    stats: {
      totalExecutions: 130,
      successCount: 112,
      failureCount: 18,
      avgDurationMs: 5200,
      lastExecutedAt: '2026-06-23T06:05:22Z'
    }
  },
  {
    id: 'wf-support-ai-router',
    name: 'Support AI Router & Sentiment Classifier',
    active: true,
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-06-18T16:15:00Z',
    triggerType: 'Event Trigger',
    nodes: [
      { id: 'n1', name: 'Zendesk New Ticket', type: 'n8n-nodes-base.zendesk', typeVersion: 1, position: [100, 200], status: 'success' },
      { id: 'n2', name: 'Gemini AI Analyze', type: 'n8n-nodes-base.googleGenAi', typeVersion: 1, position: [300, 200], status: 'success' },
      { id: 'n3', name: 'Sentiment Router', type: 'n8n-nodes-base.switch', typeVersion: 1, position: [500, 200], status: 'success' },
      { id: 'n4_neg', name: 'Jira Urgent Escalation', type: 'n8n-nodes-base.jira', typeVersion: 1, position: [700, 100], status: 'success' },
      { id: 'n4_pos', name: 'Slack VIP Customer Appreciated', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [700, 300], status: 'success' }
    ],
    connections: {
      'Zendesk New Ticket': { main: [[{ node: 'Gemini AI Analyze', type: 'main', index: 0 }]] },
      'Gemini AI Analyze': { main: [[{ node: 'Sentiment Router', type: 'main', index: 0 }]] },
      'Sentiment Router': {
        main: [
          [{ node: 'Jira Urgent Escalation', type: 'main', index: 0 }],
          [{ node: 'Slack VIP Customer Appreciated', type: 'main', index: 1 }]
        ]
      }
    },
    stats: {
      totalExecutions: 845,
      successCount: 820,
      failureCount: 25,
      avgDurationMs: 2450,
      lastExecutedAt: '2026-06-23T17:31:10Z'
    }
  },
  {
    id: 'wf-ecommerce-fulfillment',
    name: 'E-Commerce Order Fulfillment Webhook',
    active: true,
    createdAt: '2026-03-20T14:00:00Z',
    updatedAt: '2026-04-12T09:45:00Z',
    triggerType: 'Webhook',
    nodes: [
      { id: 'n1', name: 'Shopify Order Paid', type: 'n8n-nodes-base.shopify', typeVersion: 1, position: [100, 200], status: 'success' },
      { id: 'n2', name: 'Inventory DB Check', type: 'n8n-nodes-base.postgres', typeVersion: 2, position: [300, 200], status: 'success' },
      { id: 'n3', name: 'ShipStation Order Creation', type: 'n8n-nodes-base.httpRequest', typeVersion: 2, position: [500, 200], status: 'success' },
      { id: 'n4', name: 'Twilio Send Shipping SMS', type: 'n8n-nodes-base.twilio', typeVersion: 1, position: [700, 200], status: 'success' }
    ],
    connections: {
      'Shopify Order Paid': { main: [[{ node: 'Inventory DB Check', type: 'main', index: 0 }]] },
      'Inventory DB Check': { main: [[{ node: 'ShipStation Order Creation', type: 'main', index: 0 }]] },
      'ShipStation Order Creation': { main: [[{ node: 'Twilio Send Shipping SMS', type: 'main', index: 0 }]] }
    },
    stats: {
      totalExecutions: 3120,
      successCount: 3098,
      failureCount: 22,
      avgDurationMs: 1890,
      lastExecutedAt: '2026-06-23T17:28:15Z'
    }
  },
  {
    id: 'wf-db-backup',
    name: 'Database Backup & S3 Integrity Check',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
    triggerType: 'Schedule',
    nodes: [
      { id: 'n1', name: 'Weekly Sunday Midnight', type: 'n8n-nodes-base.cron', typeVersion: 1, position: [100, 200], status: 'success' },
      { id: 'n2', name: 'Execute pg_dump SSH', type: 'n8n-nodes-base.ssh', typeVersion: 1, position: [350, 200], status: 'success' },
      { id: 'n3', name: 'Upload to AWS S3', type: 'n8n-nodes-base.awsS3', typeVersion: 1, position: [600, 200], status: 'success' },
      { id: 'n4', name: 'Postgres Backup Log', type: 'n8n-nodes-base.postgres', typeVersion: 2, position: [850, 200], status: 'success' }
    ],
    connections: {
      'Weekly Sunday Midnight': { main: [[{ node: 'Execute pg_dump SSH', type: 'main', index: 0 }]] },
      'Execute pg_dump SSH': { main: [[{ node: 'Upload to AWS S3', type: 'main', index: 0 }]] },
      'Upload to AWS S3': { main: [[{ node: 'Postgres Backup Log', type: 'main', index: 0 }]] }
    },
    stats: {
      totalExecutions: 25,
      successCount: 24,
      failureCount: 1,
      avgDurationMs: 42300,
      lastExecutedAt: '2026-06-21T00:04:12Z'
    }
  },
  {
    id: 'wf-newsletter-pub',
    name: 'Newsletter Auto-Publisher (RSS)',
    active: false,
    createdAt: '2026-04-10T15:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    triggerType: 'Event Trigger',
    nodes: [
      { id: 'n1', name: 'RSS Feed Trigger', type: 'n8n-nodes-base.rssFeed', typeVersion: 1, position: [100, 200], status: 'idle' },
      { id: 'n2', name: 'Mailchimp Campaign', type: 'n8n-nodes-base.mailchimp', typeVersion: 1, position: [350, 200], status: 'idle' },
      { id: 'n3', name: 'Buffer Social Post', type: 'n8n-nodes-base.buffer', typeVersion: 1, position: [600, 200], status: 'idle' }
    ],
    connections: {
      'RSS Feed Trigger': { main: [[{ node: 'Mailchimp Campaign', type: 'main', index: 0 }]] },
      'Mailchimp Campaign': { main: [[{ node: 'Buffer Social Post', type: 'main', index: 0 }]] }
    },
    stats: {
      totalExecutions: 45,
      successCount: 41,
      failureCount: 4,
      avgDurationMs: 3100,
      lastExecutedAt: '2026-06-15T09:30:10Z'
    }
  }
];

export const MOCK_RECENT_EXECUTIONS: N8nExecution[] = [
  {
    id: 'exec-98242',
    workflowId: 'wf-support-ai-router',
    workflowName: 'Support AI Router & Sentiment Classifier',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T17:31:10Z',
    stoppedAt: '2026-06-23T17:31:12Z',
    durationMs: 2150,
    dataSizeKb: 14.5,
    triggerType: 'Event Trigger'
  },
  {
    id: 'exec-98241',
    workflowId: 'wf-ecommerce-fulfillment',
    workflowName: 'E-Commerce Order Fulfillment Webhook',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T17:28:15Z',
    stoppedAt: '2026-06-23T17:28:17Z',
    durationMs: 1850,
    dataSizeKb: 34.2,
    triggerType: 'Webhook'
  },
  {
    id: 'exec-98240',
    workflowId: 'wf-lead-enrich',
    workflowName: 'Lead Generation & CRM Sync (HubSpot)',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T17:15:00Z',
    stoppedAt: '2026-06-23T17:15:01Z',
    durationMs: 1240,
    dataSizeKb: 12.8,
    triggerType: 'Webhook'
  },
  {
    id: 'exec-98239',
    workflowId: 'wf-support-ai-router',
    workflowName: 'Support AI Router & Sentiment Classifier',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T17:10:05Z',
    stoppedAt: '2026-06-23T17:10:07Z',
    durationMs: 2320,
    dataSizeKb: 15.1,
    triggerType: 'Event Trigger'
  },
  {
    id: 'exec-98238',
    workflowId: 'wf-financial-reconcile',
    workflowName: 'Daily Financial Reconciliator',
    status: 'failed',
    mode: 'trigger',
    startedAt: '2026-06-23T06:05:22Z',
    stoppedAt: '2026-06-23T06:05:28Z',
    durationMs: 5800,
    errorNodeName: 'QuickBooks Invoices',
    errorMessage: 'Stale OAuth Token. Failed to refresh QuickBooks authorization API token. Connection closed by host.',
    errorStack: 'Error: Request failed with status code 401\n    at QuickBooksNode.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/QuickBooks/QuickBooks.node.js:1422:15)\n    at Workflow.runNode (/usr/local/lib/node_modules/n8n/node_modules/n8n-workflow/dist/src/Workflow.js:652:37)\n    at NodeExecutionRunnable.run (/usr/local/lib/node_modules/n8n/node_modules/n8n-core/dist/src/NodeExecutionRunnable.js:151:49)',
    dataSizeKb: 8.4,
    triggerType: 'Schedule'
  },
  {
    id: 'exec-98237',
    workflowId: 'wf-lead-enrich',
    workflowName: 'Lead Generation & CRM Sync (HubSpot)',
    status: 'failed',
    mode: 'webhook',
    startedAt: '2026-06-23T05:14:10Z',
    stoppedAt: '2026-06-23T05:14:11Z',
    durationMs: 1420,
    errorNodeName: 'Email Verification',
    errorMessage: 'Hunter.io API Error: Monthly query credit quota limit (5000 queries) exceeded.',
    errorStack: 'Error: 403 Payment Required\n    at HttpRequest.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/HttpRequest.node.js:315:11)\n    at Workflow.runNode (/usr/local/lib/node_modules/n8n/node_modules/n8n-workflow/dist/src/Workflow.js:652:37)',
    dataSizeKb: 2.1,
    triggerType: 'Webhook'
  },
  {
    id: 'exec-98236',
    workflowId: 'wf-support-ai-router',
    workflowName: 'Support AI Router & Sentiment Classifier',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T04:22:15Z',
    stoppedAt: '2026-06-23T04:22:18Z',
    durationMs: 2540,
    dataSizeKb: 13.9,
    triggerType: 'Event Trigger'
  },
  {
    id: 'exec-98235',
    workflowId: 'wf-ecommerce-fulfillment',
    workflowName: 'E-Commerce Order Fulfillment Webhook',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T03:44:11Z',
    stoppedAt: '2026-06-23T03:44:13Z',
    durationMs: 1910,
    dataSizeKb: 28.7,
    triggerType: 'Webhook'
  },
  {
    id: 'exec-98234',
    workflowId: 'wf-lead-enrich',
    workflowName: 'Lead Generation & CRM Sync (HubSpot)',
    status: 'success',
    mode: 'webhook',
    startedAt: '2026-06-23T02:11:50Z',
    stoppedAt: '2026-06-23T02:11:51Z',
    durationMs: 1310,
    dataSizeKb: 11.2,
    triggerType: 'Webhook'
  },
  {
    id: 'exec-98233',
    workflowId: 'wf-support-ai-router',
    workflowName: 'Support AI Router & Sentiment Classifier',
    status: 'failed',
    mode: 'webhook',
    startedAt: '2026-06-22T23:14:02Z',
    stoppedAt: '2026-06-22T23:14:04Z',
    durationMs: 1980,
    errorNodeName: 'Gemini AI Analyze',
    errorMessage: 'GoogleGenAI API Error: 429 Resource has been exhausted (e.g. queries per minute quota).',
    errorStack: 'GoogleGenAIError: Resource has been exhausted\n    at GeminiNode.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/GoogleGenAi/GoogleGenAi.node.js:452:19)',
    dataSizeKb: 4.6,
    triggerType: 'Event Trigger'
  }
];

export const MOCK_ERRORS: N8nError[] = [
  {
    id: 'err-1',
    executionId: 'exec-98238',
    workflowId: 'wf-financial-reconcile',
    workflowName: 'Daily Financial Reconciliator',
    nodeName: 'QuickBooks Invoices',
    nodeType: 'n8n-nodes-base.quickbooks',
    message: 'Stale OAuth Token. Failed to refresh QuickBooks authorization API token. Connection closed by host.',
    stack: 'Error: Request failed with status code 401\n    at QuickBooksNode.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/QuickBooks/QuickBooks.node.js:1422:15)',
    timestamp: '2026-06-23T06:05:22Z',
    severity: 'high'
  },
  {
    id: 'err-2',
    executionId: 'exec-98237',
    workflowId: 'wf-lead-enrich',
    workflowName: 'Lead Generation & CRM Sync (HubSpot)',
    nodeName: 'Email Verification',
    nodeType: 'n8n-nodes-base.httpRequest',
    message: 'Hunter.io API Error: Monthly query credit quota limit (5000 queries) exceeded.',
    stack: 'Error: 403 Payment Required\n    at HttpRequest.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/HttpRequest.node.js:315:11)',
    timestamp: '2026-06-23T05:14:10Z',
    severity: 'medium'
  },
  {
    id: 'err-3',
    executionId: 'exec-98233',
    workflowId: 'wf-support-ai-router',
    workflowName: 'Support AI Router & Sentiment Classifier',
    nodeName: 'Gemini AI Analyze',
    nodeType: 'n8n-nodes-base.googleGenAi',
    message: 'GoogleGenAI API Error: 429 Resource has been exhausted (e.g. queries per minute quota).',
    stack: 'GoogleGenAIError: Resource has been exhausted\n    at GeminiNode.execute (/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/GoogleGenAi/GoogleGenAi.node.js:452:19)',
    timestamp: '2026-06-22T23:14:02Z',
    severity: 'high'
  }
];

// Generate 14 days of historical executions for graphing
export const generateHistoryData = (daysCount = 14) => {
  const data = [];
  const baseDate = new Date();
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    
    // Add variations for a realistic look
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseExecs = isWeekend ? 80 : 250;
    const fluctuation = Math.floor(Math.random() * (isWeekend ? 30 : 60)) - (isWeekend ? 15 : 30);
    const total = baseExecs + fluctuation;
    
    // Failed count generally between 2% and 8%
    const failedRatio = isWeekend ? 0.02 + Math.random() * 0.03 : 0.03 + Math.random() * 0.05;
    const failed = Math.floor(total * failedRatio);
    const success = total - failed;
    
    data.push({
      date: dateStr,
      success,
      failed,
      total,
      successRate: parseFloat(((success / total) * 100).toFixed(1)),
      avgDuration: Math.floor(1200 + Math.random() * 800) // avg ms
    });
  }
  return data;
};

export const MOCK_HISTORY = generateHistoryData(14);

// Calculations helper
export const calculateSummaryStats = (
  workflows: N8nWorkflow[],
  executions: N8nExecution[],
  history: any[]
): N8nSummaryStats => {
  const activeWorkflows = workflows.filter(w => w.active).length;
  const totalWorkflows = workflows.length;
  
  // Sum executions over history
  const historicalTotal = history.reduce((sum, h) => sum + h.total, 0);
  const historicalSuccess = history.reduce((sum, h) => sum + h.success, 0);
  const historicalFailed = history.reduce((sum, h) => sum + h.failed, 0);
  
  const successRate = historicalTotal > 0 ? (historicalSuccess / historicalTotal) * 100 : 95.8;
  const runningExecutions = executions.filter(e => e.status === 'running').length;
  const failedExecutions = executions.filter(e => e.status === 'failed').length;
  
  // Calculations based on mock workflow stats
  const totalExecs = workflows.reduce((sum, w) => sum + w.stats.totalExecutions, 0);
  const totalSuccess = workflows.reduce((sum, w) => sum + w.stats.successCount, 0);
  const totalFailed = workflows.reduce((sum, w) => sum + w.stats.failureCount, 0);
  
  const avgDuration = workflows.length > 0 
    ? workflows.reduce((sum, w) => sum + w.stats.avgDurationMs, 0) / workflows.length
    : 1800;

  return {
    totalWorkflows,
    activeWorkflows,
    totalExecutions: totalExecs,
    successfulExecutions: totalSuccess,
    failedExecutions: totalFailed,
    runningExecutions,
    successRate: parseFloat((totalSuccess / totalExecs * 100).toFixed(2)),
    totalErrors: totalFailed,
    avgDurationMs: Math.round(avgDuration),
    totalDataSizeKb: totalExecs * 15.2 // average data size per execution
  };
};

export const DEFAULT_STATS = calculateSummaryStats(MOCK_WORKFLOWS, MOCK_RECENT_EXECUTIONS, MOCK_HISTORY);

// Icon mapping based on node type
export const getNodeColorClass = (type: string, status?: 'success' | 'failed' | 'idle') => {
  if (status === 'success') return 'bg-emerald-950 border-emerald-500 text-emerald-400';
  if (status === 'failed') return 'bg-rose-950 border-rose-500 text-rose-400';
  
  if (type.includes('webhook') || type.includes('trigger') || type.includes('cron')) {
    return 'bg-amber-950 border-amber-600 text-amber-400';
  }
  if (type.includes('googleGenAi') || type.includes('openAi')) {
    return 'bg-violet-950 border-violet-500 text-violet-400';
  }
  if (type.includes('slack') || type.includes('twilio') || type.includes('gmail')) {
    return 'bg-sky-950 border-sky-500 text-sky-400';
  }
  if (type.includes('postgres') || type.includes('quickbooks') || type.includes('hubspot')) {
    return 'bg-blue-950 border-blue-500 text-blue-400';
  }
  return 'bg-zinc-900 border-zinc-700 text-zinc-300';
};
