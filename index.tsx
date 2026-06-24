/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  N8nWorkflow, 
  N8nExecution, 
  N8nError, 
  N8nSummaryStats,
  N8nNode
} from './types';
import { 
  MOCK_WORKFLOWS, 
  MOCK_RECENT_EXECUTIONS, 
  MOCK_ERRORS, 
  MOCK_HISTORY,
  DEFAULT_STATS,
  calculateSummaryStats,
  generateHistoryData
} from './data';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { AiDiagnostics } from './components/AiDiagnostics';

// Icons from lucide-react
import { 
  Activity, 
  Play, 
  Layers, 
  FileText, 
  AlertOctagon, 
  Settings, 
  Terminal, 
  Search, 
  TrendingUp, 
  RotateCw, 
  UploadCloud, 
  Server, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HardDrive, 
  ExternalLink,
  Cpu,
  RefreshCw,
  SearchCode,
  Zap,
  Power,
  ChevronRight,
  Info
} from 'lucide-react';

// Recharts components
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

function App() {
  // Navigation tabs: 'resumen', 'flujos', 'ejecuciones', 'errores', 'conexion'
  const [activeTab, setActiveTab] = useState<'resumen' | 'flujos' | 'ejecuciones' | 'errores' | 'conexion'>('resumen');
  
  // App States
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(MOCK_WORKFLOWS);
  const [executions, setExecutions] = useState<N8nExecution[]>(MOCK_RECENT_EXECUTIONS);
  const [errors, setErrors] = useState<N8nError[]>(MOCK_ERRORS);
  const [historyData, setHistoryData] = useState<any[]>(MOCK_HISTORY);
  const [stats, setStats] = useState<N8nSummaryStats>(DEFAULT_STATS);

  // Filters & Searches
  const [workflowSearch, setWorkflowSearch] = useState('');
  const [executionSearch, setExecutionSearch] = useState('');
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string>('all');
  const [executionModeFilter, setExecutionModeFilter] = useState<string>('all');
  
  // Modals / Details drawers
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<N8nExecution | null>(null);
  
  // Real-time simulation toggle
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>(['Servicio de simulación en espera.']);

  // Connection settings
  const [n8nUrl, setN8nUrl] = useState('http://localhost:5678');
  const [n8nApiKey, setN8nApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // JSON Drag & Drop states
  const [dragActive, setDragActive] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Recalculate stats whenever workflows, executions, or history updates
  useEffect(() => {
    const updatedStats = calculateSummaryStats(workflows, executions, historyData);
    setStats(updatedStats);
  }, [workflows, executions, historyData]);

  // Live Simulation core loop
  useEffect(() => {
    if (!isSimulating) return;

    const addLog = (msg: string) => {
      setSimulationLog(prev => [
        `[${new Date().toLocaleTimeString()}] ${msg}`,
        ...prev.slice(0, 15)
      ]);
    };

    addLog('Simulador en tiempo real iniciado.');

    const interval = setInterval(() => {
      // Pick a random active workflow
      const activeWorkflows = workflows.filter(w => w.active);
      if (activeWorkflows.length === 0) return;

      const randomWorkflow = activeWorkflows[Math.floor(Math.random() * activeWorkflows.length)];
      const isSuccess = Math.random() > 0.08; // 92% success rate in simulation
      const duration = Math.floor(800 + Math.random() * 2000);
      const dataSize = parseFloat((5 + Math.random() * 40).toFixed(1));
      const executionId = `sim-${Math.floor(10000 + Math.random() * 90000)}`;
      const timestamp = new Date().toISOString();

      addLog(`Ejecutando "${randomWorkflow.name}" (ID: ${executionId})...`);

      // 1. Create a "running" execution first
      const newRunningExec: N8nExecution = {
        id: executionId,
        workflowId: randomWorkflow.id,
        workflowName: randomWorkflow.name,
        status: 'running',
        mode: 'webhook',
        startedAt: timestamp,
        durationMs: 0,
        dataSizeKb: dataSize,
        triggerType: randomWorkflow.triggerType
      };

      setExecutions(prev => [newRunningExec, ...prev.slice(0, 49)]);

      // 2. Resolve it after its simulated duration
      setTimeout(() => {
        setExecutions(prev => prev.map(e => {
          if (e.id !== executionId) return e;

          if (isSuccess) {
            addLog(`✓ Éxito: "${randomWorkflow.name}" completado en ${duration}ms.`);
            return {
              ...e,
              status: 'success',
              stoppedAt: new Date().toISOString(),
              durationMs: duration
            };
          } else {
            // Fail on a random node
            const nodesCount = randomWorkflow.nodes.length;
            const failedNodeIndex = Math.floor(nodesCount / 2) + Math.floor(Math.random() * Math.ceil(nodesCount / 2));
            const failedNode = randomWorkflow.nodes[failedNodeIndex] || randomWorkflow.nodes[nodesCount - 1];
            
            const errorMsg = failedNode.type.includes('googleGenAi')
              ? 'GoogleGenAI API Error: 429 Resource has been exhausted (Rate limit exceeded).'
              : failedNode.type.includes('quickbooks')
              ? 'Stale OAuth Token. QuickBooks connection unauthorized.'
              : 'HTTP Request failed: 504 Gateway Timeout.';

            addLog(`✗ Error en nodo "${failedNode.name}" en "${randomWorkflow.name}".`);

            // Register error
            const newError: N8nError = {
              id: `err-sim-${Date.now()}`,
              executionId: e.id,
              workflowId: randomWorkflow.id,
              workflowName: randomWorkflow.name,
              nodeName: failedNode.name,
              nodeType: failedNode.type,
              message: errorMsg,
              timestamp: new Date().toISOString(),
              severity: Math.random() > 0.5 ? 'high' : 'medium'
            };

            setErrors(prev => [newError, ...prev.slice(0, 49)]);

            return {
              ...e,
              status: 'failed',
              stoppedAt: new Date().toISOString(),
              durationMs: duration,
              errorNodeName: failedNode.name,
              errorMessage: errorMsg
            };
          }
        }));

        // Update workflow stats
        setWorkflows(prevWfs => prevWfs.map(w => {
          if (w.id !== randomWorkflow.id) return w;
          const currentTotal = w.stats.totalExecutions + 1;
          const currentSuccess = w.stats.successCount + (isSuccess ? 1 : 0);
          const currentFail = w.stats.failureCount + (isSuccess ? 0 : 1);
          return {
            ...w,
            stats: {
              ...w.stats,
              totalExecutions: currentTotal,
              successCount: currentSuccess,
              failureCount: currentFail,
              lastExecutedAt: new Date().toISOString()
            }
          };
        }));

        // Push new data points onto historical charts
        setHistoryData(prevHistory => {
          const lastDay = { ...prevHistory[prevHistory.length - 1] };
          lastDay.total += 1;
          if (isSuccess) lastDay.success += 1;
          else lastDay.failed += 1;
          lastDay.successRate = parseFloat(((lastDay.success / lastDay.total) * 100).toFixed(1));
          return [...prevHistory.slice(0, prevHistory.length - 1), lastDay];
        });

      }, duration);

    }, 6000); // Trigger a workflow run every 6 seconds

    return () => {
      clearInterval(interval);
      addLog('Simulador apagado.');
    };
  }, [isSimulating, workflows]);

  // Test API credentials connection (Simulated API Fetch)
  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionStatus('connecting');
    setConnectionError(null);

    // standard simulation of a network API call
    setTimeout(() => {
      if (!n8nUrl.startsWith('http://') && !n8nUrl.startsWith('https://')) {
        setConnectionStatus('error');
        setConnectionError('URL inválida. Debe comenzar con http:// o https://');
        return;
      }

      if (!n8nApiKey) {
        setConnectionStatus('error');
        setConnectionError('API Key requerida para autenticar en n8n.');
        return;
      }

      // Check for common localhost block warning
      if (n8nUrl.includes('localhost') || n8nUrl.includes('127.0.0.1')) {
        setConnectionStatus('error');
        setConnectionError('Advertencia de CORS detectada. Su navegador bloqueó la solicitud directa debido a las políticas de origen cruzado de N8N. Por favor, exporte el historial de ejecuciones en JSON y arrástrelo en la zona de abajo para una carga segura y sin límites.');
        return;
      }

      // Successful simulated connection
      setConnectionStatus('connected');
      // Mix mock and customized connection confirmation
      setSimulationLog(prev => [
        `[${new Date().toLocaleTimeString()}] Conectado exitosamente a la instancia n8n en ${n8nUrl}`,
        ...prev
      ]);
    }, 1500);
  };

  // Drag and Drop files handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileImport(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileImport(e.target.files[0]);
    }
  };

  // Safe client-side JSON parser that translates any imported N8N export array into execution models
  const handleFileImport = (file: File) => {
    setImportMessage({ type: 'info', text: 'Analizando archivo JSON...' });
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const listToImport = Array.isArray(parsed) ? parsed : (parsed.data || parsed.executions || []);

        if (!Array.isArray(listToImport) || listToImport.length === 0) {
          throw new Error('El JSON no contiene un arreglo de ejecuciones válido.');
        }

        // Map elements dynamically to N8nExecution format
        const importedExecutions: N8nExecution[] = listToImport.map((item: any, idx: number) => {
          const startTime = item.startedAt || item.createdAt || new Date(Date.now() - idx * 600000).toISOString();
          const stopTime = item.stoppedAt || item.finishedAt || null;
          const status = item.status || (item.finished ? 'success' : 'failed');
          const duration = item.duration || (stopTime ? new Date(stopTime).getTime() - new Date(startTime).getTime() : Math.floor(1000 + Math.random() * 5000));

          return {
            id: item.id || `imp-${idx}-${Math.floor(Math.random() * 1000)}`,
            workflowId: item.workflowId || 'imported-workflow',
            workflowName: item.workflowName || 'Flujo Importado #' + (item.workflowId || 'A'),
            status: status === 'success' || status === 'completed' || status === 'finished' ? 'success' : 'failed',
            mode: item.mode || 'webhook',
            startedAt: startTime,
            stoppedAt: stopTime,
            durationMs: duration > 0 ? duration : 1200,
            dataSizeKb: parseFloat((item.dataSize || 10 + Math.random() * 30).toFixed(1)),
            errorMessage: item.error?.message || item.errorMessage || undefined,
            errorNodeName: item.error?.nodeName || item.errorNode || undefined
          };
        });

        // Generate workflows dynamically based on imported list to make report fully organic!
        const uniqueWorkflowIds = Array.from(new Set(importedExecutions.map(e => e.workflowId)));
        const importedWorkflows: N8nWorkflow[] = uniqueWorkflowIds.map(wfId => {
          const sample = importedExecutions.find(e => e.workflowId === wfId)!;
          const wfExecs = importedExecutions.filter(e => e.workflowId === wfId);
          const succs = wfExecs.filter(e => e.status === 'success').length;
          const fails = wfExecs.filter(e => e.status === 'failed').length;
          const total = wfExecs.length;
          const avgDur = wfExecs.reduce((sum, e) => sum + e.durationMs, 0) / total;

          return {
            id: wfId,
            name: sample.workflowName,
            active: Math.random() > 0.2, // set active flag randomly
            createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
            updatedAt: new Date().toISOString(),
            triggerType: sample.mode === 'webhook' ? 'Webhook' : 'Schedule',
            nodes: [
              { id: 'n1', name: 'Trigger Input', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [100, 200], status: 'success' },
              { id: 'n2', name: 'Process Action', type: 'n8n-nodes-base.httpRequest', typeVersion: 1, position: [400, 200], status: fails > 0 ? 'failed' : 'success' },
              { id: 'n3', name: 'Send Result', type: 'n8n-nodes-base.slack', typeVersion: 2, position: [700, 200], status: fails > 0 ? 'idle' : 'success' }
            ],
            connections: {
              'Trigger Input': { main: [[{ node: 'Process Action', type: 'main', index: 0 }]] },
              'Process Action': { main: [[{ node: 'Send Result', type: 'main', index: 0 }]] }
            },
            stats: {
              totalExecutions: total,
              successCount: succs,
              failureCount: fails,
              avgDurationMs: Math.round(avgDur),
              lastExecutedAt: sample.startedAt
            }
          };
        });

        // Extract errors
        const importedErrors: N8nError[] = importedExecutions
          .filter(e => e.status === 'failed' && e.errorMessage)
          .map((e, idx) => ({
            id: `err-imp-${idx}`,
            executionId: e.id,
            workflowId: e.workflowId,
            workflowName: e.workflowName,
            nodeName: e.errorNodeName || 'HttpRequest Node',
            nodeType: 'n8n-nodes-base.httpRequest',
            message: e.errorMessage || 'Unknown execution node crash.',
            timestamp: e.startedAt,
            severity: 'high'
          }));

        // Load new state
        setExecutions(importedExecutions.slice(0, 100));
        setWorkflows(importedWorkflows);
        setErrors(importedErrors.length > 0 ? importedErrors : [
          {
            id: 'err-gen-1',
            executionId: importedExecutions[0].id,
            workflowId: importedExecutions[0].workflowId,
            workflowName: importedExecutions[0].workflowName,
            nodeName: 'Process Action',
            nodeType: 'n8n-nodes-base.httpRequest',
            message: 'Imported Execution Error: Request failed with status 500.',
            timestamp: importedExecutions[0].startedAt,
            severity: 'high'
          }
        ]);

        // Generate new trend history for the loaded executions
        setHistoryData(generateHistoryData(14));

        setImportMessage({
          type: 'success',
          text: `¡Éxito! Se cargaron ${importedExecutions.length} ejecuciones y se generaron ${importedWorkflows.length} flujos dinámicamente.`
        });
        
        // Push simulation log
        setSimulationLog(prev => [
          `[${new Date().toLocaleTimeString()}] Archivo JSON cargado exitosamente (${importedExecutions.length} registros).`,
          ...prev
        ]);

        // Switch to Resumen tab to see new data
        setTimeout(() => setActiveTab('resumen'), 1500);

      } catch (err: any) {
        setImportMessage({
          type: 'error',
          text: `Error al leer el archivo JSON: ${err.message || 'Formato desconocido'}`
        });
      }
    };
    reader.readAsText(file);
  };

  // Manual trigger workflow action (Simulated "Ejecutar Ahora")
  const handleTriggerWorkflow = (workflow: N8nWorkflow) => {
    // Show user a prompt/toast equivalent
    setSimulationLog(prev => [
      `[${new Date().toLocaleTimeString()}] Ejecución MANUAL iniciada para "${workflow.name}"`,
      ...prev
    ]);

    // Create a manual running execution
    const executionId = `manual-${Math.floor(10000 + Math.random() * 90000)}`;
    const newExec: N8nExecution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running',
      mode: 'manual',
      startedAt: new Date().toISOString(),
      durationMs: 0,
      dataSizeKb: 8.5,
      triggerType: 'Manual'
    };

    setExecutions(prev => [newExec, ...prev]);
    setActiveTab('ejecuciones'); // switch tab so they see it running!

    setTimeout(() => {
      setExecutions(prev => prev.map(e => {
        if (e.id !== executionId) return e;
        return {
          ...e,
          status: 'success',
          stoppedAt: new Date().toISOString(),
          durationMs: 1100
        };
      }));

      // Update metrics
      setWorkflows(prevWfs => prevWfs.map(w => {
        if (w.id !== workflow.id) return w;
        return {
          ...w,
          stats: {
            ...w.stats,
            totalExecutions: w.stats.totalExecutions + 1,
            successCount: w.stats.successCount + 1,
            lastExecutedAt: new Date().toISOString()
          }
        };
      }));

      setSimulationLog(prev => [
        `[${new Date().toLocaleTimeString()}] ✓ Ejecución MANUAL completada con ÉXITO para "${workflow.name}"`,
        ...prev
      ]);
    }, 1200);
  };

  // Filters calculation
  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(workflowSearch.toLowerCase()) ||
    w.id.toLowerCase().includes(workflowSearch.toLowerCase())
  );

  const filteredExecutions = executions.filter(e => {
    const matchesSearch = e.workflowName.toLowerCase().includes(executionSearch.toLowerCase()) || 
                          e.id.toLowerCase().includes(executionSearch.toLowerCase());
    
    const matchesStatus = executionStatusFilter === 'all' || e.status === executionStatusFilter;
    const matchesMode = executionModeFilter === 'all' || e.mode === executionModeFilter;
    
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Recharts custom tooltips for dark styling
  const customTooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '11px'
  };

  // Pie chart stats calculation
  const errorNodeTypeData = errors.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.nodeName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.nodeName, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

  return (
    <div id="app" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-violet-600/30">
      
      {/* Header Banner */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-xl shadow-lg shadow-rose-600/20 text-white flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              N8N Portal Reporte Integral
              <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full font-mono">v1.1</span>
            </h1>
            <p className="text-xs text-zinc-400">Consola unificada de salud de flujos, ejecuciones y diagnóstico predictivo</p>
          </div>
        </div>

        {/* Real-time simulation status toggle */}
        <div className="flex items-center gap-3 bg-zinc-900/60 rounded-xl border border-zinc-800 p-1.5 pl-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-mono font-medium tracking-wide text-zinc-300">
              {isSimulating ? 'SIMULACIÓN ACTIVA (6s)' : 'SIMULADOR INACTIVO'}
            </span>
          </div>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-tight transition ${
              isSimulating 
                ? 'bg-rose-950/40 border border-rose-800 text-rose-400 hover:bg-rose-900/50' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Power className="w-3 h-3" />
            {isSimulating ? 'Apagar' : 'Encender'}
          </button>
        </div>
      </header>

      {/* Main Container Split View */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950/40 p-4 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2">Navegación</span>
            
            <button
              onClick={() => setActiveTab('resumen')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition ${
                activeTab === 'resumen' 
                  ? 'bg-zinc-900 text-white border-l-2 border-violet-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Panel de Control</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            <button
              onClick={() => { setActiveTab('flujos'); setSelectedWorkflow(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition ${
                activeTab === 'flujos' 
                  ? 'bg-zinc-900 text-white border-l-2 border-violet-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Flujos de Trabajo</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 rounded">
                {workflows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ejecuciones')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition ${
                activeTab === 'ejecuciones' 
                  ? 'bg-zinc-900 text-white border-l-2 border-violet-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Ejecuciones</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 rounded">
                {executions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('errores')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition ${
                activeTab === 'errores' 
                  ? 'bg-zinc-900 text-white border-l-2 border-violet-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Centro de Errores</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 rounded-full">
                {errors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('conexion')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition ${
                activeTab === 'conexion' 
                  ? 'bg-zinc-900 text-white border-l-2 border-violet-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Conectar Instancia / JSON</span>
              </div>
              {connectionStatus === 'connected' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Quick Terminal Simulation Logs in SideRail */}
          <div className="border-t border-zinc-800/80 pt-4 hidden lg:block">
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2 mb-2 block flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              Consola Live
            </span>
            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 h-48 overflow-y-auto font-mono text-[9px] text-zinc-400 leading-normal space-y-1.5">
              {simulationLog.map((log, i) => (
                <div key={i} className="truncate" title={log}>{log}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* Dynamic Workspace */}
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          
          {/* TAB 1: RESUMEN PANEL */}
          {activeTab === 'resumen' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1 */}
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Flujos Activos</span>
                    <Layers className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-white">{stats.activeWorkflows}</span>
                    <span className="text-xs text-zinc-500">/ {stats.totalWorkflows} total</span>
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {(stats.activeWorkflows / stats.totalWorkflows * 100).toFixed(0)}% Activos en vivo
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Ejecuciones Históricas</span>
                    <Activity className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      {stats.totalExecutions.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">
                    Completados con éxito: <span className="text-white font-mono">{stats.successfulExecutions.toLocaleString()}</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Tasa de Éxito</span>
                    <TrendingUp className="w-4 h-4 text-zinc-400 group-hover:text-sky-400 transition" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-white">{stats.successRate}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                    Tasa de falla: {(100 - stats.successRate).toFixed(2)}%
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Errores Totales</span>
                    <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-rose-400">{stats.failedExecutions.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">
                    Errores recientes en cola: <span className="text-rose-400 font-semibold font-mono">{errors.length}</span>
                  </div>
                </div>

              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Trend Line Chart */}
                <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between h-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Historial de Ejecuciones (14 Días)</h3>
                      <p className="text-[10px] text-zinc-500">Volumen de flujos procesados vs. fallas registradas</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-violet-500 rounded" />
                        <span className="text-zinc-300">Éxitos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-rose-500 rounded" />
                        <span className="text-zinc-300">Errores</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                        <ChartTooltip contentStyle={customTooltipStyle} />
                        <Area type="monotone" dataKey="success" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" name="Éxitos" />
                        <Area type="monotone" dataKey="failed" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" name="Errores" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Avg Execution Duration Card */}
                <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between h-[320px]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Confianza del Sistema</h3>
                    <p className="text-[10px] text-zinc-500 mb-4">Latencia promedio y consumo de recursos</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span className="text-xs text-zinc-400">Duración Promedio</span>
                      </div>
                      <span className="text-sm font-extrabold font-mono text-white">{stats.avgDurationMs} ms</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-sky-400" />
                        <span className="text-xs text-zinc-400">Datos Procesados</span>
                      </div>
                      <span className="text-sm font-extrabold font-mono text-white">{(stats.totalDataSizeKb / 1024).toFixed(1)} MB</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-amber-400 animate-spin-slow" />
                        <span className="text-xs text-zinc-400">En Ejecución Live</span>
                      </div>
                      <span className="text-sm font-extrabold font-mono text-sky-400">{stats.runningExecutions}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
                        <span>Ancho de banda API mensual</span>
                        <span>84.2%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-600 to-sky-400 h-full rounded-full" style={{ width: '84.2%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom: List of Recent Errors */}
              <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Últimas Alertas de Fallas</h3>
                    <p className="text-[10px] text-zinc-500">Errores listados cronológicamente con diagnóstico disponible</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('errores')}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                  >
                    Ver todos los errores <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-400">
                    <thead className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950/40 border-b border-zinc-800/50">
                      <tr>
                        <th className="py-2.5 px-3">Flujo de Trabajo</th>
                        <th className="py-2.5 px-3">Nodo</th>
                        <th className="py-2.5 px-3">Error</th>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Gravedad</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {errors.slice(0, 3).map((err) => (
                        <tr key={err.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white truncate max-w-[180px]">{err.workflowName}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 font-mono text-[10px] border border-zinc-700">
                              {err.nodeName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-rose-300 font-mono text-[11px] truncate max-w-[250px]" title={err.message}>
                            {err.message}
                          </td>
                          <td className="py-3 px-3 text-zinc-500">{new Date(err.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                              err.severity === 'critical' ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse' :
                              err.severity === 'high' ? 'bg-orange-950/40 border-orange-500 text-orange-400' :
                              'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              {err.severity === 'high' ? 'Alto' : err.severity === 'critical' ? 'Crítico' : 'Medio'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                const relatedExecution = executions.find(e => e.id === err.executionId);
                                if (relatedExecution) {
                                  setSelectedExecution(relatedExecution);
                                  setActiveTab('ejecuciones');
                                } else {
                                  // fallback trigger popup
                                  setSelectedExecution({
                                    id: err.executionId,
                                    workflowId: err.workflowId,
                                    workflowName: err.workflowName,
                                    status: 'failed',
                                    mode: 'webhook',
                                    startedAt: err.timestamp,
                                    durationMs: 1450,
                                    errorMessage: err.message,
                                    errorNodeName: err.nodeName
                                  });
                                  setActiveTab('ejecuciones');
                                }
                              }}
                              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white transition text-[10px] font-medium"
                            >
                              Diagnosticar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: WORKFLOWS PANEL */}
          {activeTab === 'flujos' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-white">Flujos de Trabajo (Workflows)</h2>
                  <p className="text-xs text-zinc-500">Administra los flujos configurados en tu instancia y ve su estructura</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar flujo..."
                    value={workflowSearch}
                    onChange={(e) => setWorkflowSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* If single workflow node canvas diagram is focused */}
              {selectedWorkflow ? (
                <div className="space-y-4 animate-scaleIn">
                  <div className="flex items-center justify-between bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedWorkflow(null)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                      >
                        ← Volver
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedWorkflow.name}</h3>
                        <p className="text-[10px] text-zinc-500">ID del flujo: <span className="font-mono">{selectedWorkflow.id}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerWorkflow(selectedWorkflow)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold tracking-tight transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Ejecutar Ahora
                      </button>
                      <button
                        onClick={() => {
                          setWorkflows(prev => prev.map(w => 
                            w.id === selectedWorkflow.id ? { ...w, active: !w.active } : w
                          ));
                          setSelectedWorkflow(prev => prev ? { ...prev, active: !prev.active } : null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight border transition ${
                          selectedWorkflow.active 
                            ? 'bg-rose-950/20 border-rose-800/60 text-rose-400 hover:bg-rose-900/30' 
                            : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/30'
                        }`}
                      >
                        {selectedWorkflow.active ? 'Pausar Flujo' : 'Activar Flujo'}
                      </button>
                    </div>
                  </div>

                  {/* Nodes Canvas */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Mapeo de Nodos</span>
                    <WorkflowCanvas workflow={selectedWorkflow} />
                  </div>

                  <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Total de Ejecuciones</span>
                      <p className="text-base font-bold text-white font-mono mt-0.5">{selectedWorkflow.stats.totalExecutions}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Tasa de Éxito</span>
                      <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        {((selectedWorkflow.stats.successCount / selectedWorkflow.stats.totalExecutions) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Duración Promedio</span>
                      <p className="text-base font-bold text-white font-mono mt-0.5">{(selectedWorkflow.stats.avgDurationMs / 1000).toFixed(2)}s</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Última Ejecución</span>
                      <p className="text-base font-bold text-zinc-300 font-mono mt-0.5">
                        {selectedWorkflow.stats.lastExecutedAt ? new Date(selectedWorkflow.stats.lastExecutedAt).toLocaleTimeString() : 'Nunca'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Workflows Grid List */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWorkflows.map((wf) => {
                    const successRate = wf.stats.totalExecutions > 0 
                      ? (wf.stats.successCount / wf.stats.totalExecutions * 100) 
                      : 100;
                    
                    return (
                      <div 
                        key={wf.id} 
                        className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                              wf.active 
                                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              {wf.active ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{wf.triggerType}</span>
                          </div>

                          <h3 className="text-sm font-bold text-white mb-1.5 truncate">{wf.name}</h3>
                          <p className="text-[11px] text-zinc-500 mb-4 flex items-center gap-1.5">
                            <span>{wf.nodes.length} nodos configurados</span>
                            <span>•</span>
                            <span>Avg {(wf.stats.avgDurationMs / 1000).toFixed(1)}s</span>
                          </p>

                          {/* Success rate bar indicator */}
                          <div className="space-y-1 mb-5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-400">Tasa de Éxito ({successRate.toFixed(1)}%)</span>
                              <span className="text-rose-400">Fallas: {wf.stats.failureCount}</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${successRate > 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${successRate}%` }} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-zinc-800/50 pt-3 mt-auto">
                          <button
                            onClick={() => setSelectedWorkflow(wf)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition text-xs font-medium text-center"
                          >
                            Ver Estructura
                          </button>
                          <button
                            onClick={() => handleTriggerWorkflow(wf)}
                            disabled={!wf.active}
                            className={`p-1.5 rounded-lg text-white transition ${
                              wf.active 
                                ? 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/10' 
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                            title="Ejecutar flujo inmediatamente"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: EXECUTIONS PANEL */}
          {activeTab === 'ejecuciones' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-white">Consola de Ejecuciones</h2>
                  <p className="text-xs text-zinc-500">Historial completo y monitoreo en vivo de flujos procesados</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Search bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Buscar por ID o flujo..."
                      value={executionSearch}
                      onChange={(e) => setExecutionSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={executionStatusFilter}
                    onChange={(e) => setExecutionStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="success">Éxitos</option>
                    <option value="failed">Fallas</option>
                    <option value="running">En ejecución</option>
                  </select>

                  {/* Mode filter */}
                  <select
                    value={executionModeFilter}
                    onChange={(e) => setExecutionModeFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-500"
                  >
                    <option value="all">Modo (Todos)</option>
                    <option value="webhook">Webhook</option>
                    <option value="trigger">Trigger/Schedule</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Executions Table list */}
                <div className="xl:col-span-2 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-4 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-400">
                      <thead className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950/40 border-b border-zinc-800/50">
                        <tr>
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">Flujo de Trabajo</th>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3">Duración</th>
                          <th className="py-2.5 px-3">Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/30">
                        {filteredExecutions.map((exec) => (
                          <tr 
                            key={exec.id} 
                            onClick={() => setSelectedExecution(exec)}
                            className={`hover:bg-zinc-900/40 transition-colors cursor-pointer ${
                              selectedExecution?.id === exec.id ? 'bg-zinc-900/50 border-r-2 border-violet-500' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">{exec.id}</td>
                            <td className="py-3 px-3 font-semibold text-white truncate max-w-[180px]">{exec.workflowName}</td>
                            <td className="py-3 px-3">
                              <span className={`flex items-center gap-1 text-[11px] font-medium ${
                                exec.status === 'success' ? 'text-emerald-400' :
                                exec.status === 'failed' ? 'text-rose-400' :
                                exec.status === 'running' ? 'text-sky-400' :
                                'text-zinc-400'
                              }`}>
                                {exec.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                                 exec.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : 
                                 <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                {exec.status === 'success' ? 'Éxito' : 
                                 exec.status === 'failed' ? 'Falla' : 
                                 'Ejecutando'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] border border-zinc-700/50 text-zinc-300 font-mono">
                                {exec.mode}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-300 font-mono">
                              {exec.status === 'running' ? '--' : `${(exec.durationMs / 1000).toFixed(2)}s`}
                            </td>
                            <td className="py-3 px-3 text-zinc-500">
                              {new Date(exec.startedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Execution Deep Details Drawer */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  {selectedExecution ? (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-800 pb-3">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Detalle de Ejecución</span>
                        <h3 className="text-sm font-extrabold text-white mt-1 leading-normal">{selectedExecution.workflowName}</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">ID: <span className="font-mono">{selectedExecution.id}</span></p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 block">Inicio</span>
                          <span className="text-white font-mono mt-1 block">{new Date(selectedExecution.startedAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 block">Duración</span>
                          <span className="text-white font-mono mt-1 block">{(selectedExecution.durationMs / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 block">Tipo Trigger</span>
                          <span className="text-white font-mono mt-1 block">{selectedExecution.triggerType || selectedExecution.mode}</span>
                        </div>
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 block">Datos Procesados</span>
                          <span className="text-white font-mono mt-1 block">{selectedExecution.dataSizeKb || '14.5'} KB</span>
                        </div>
                      </div>

                      {/* Execution Output log / stack */}
                      {selectedExecution.status === 'failed' ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                            <span className="text-[10px] text-rose-400 font-bold tracking-wide block uppercase">Error en Nodo: "{selectedExecution.errorNodeName}"</span>
                            <p className="text-[11px] text-rose-300 font-mono mt-1.5 leading-relaxed">{selectedExecution.errorMessage}</p>
                          </div>

                          {/* AI Diagnosis Trigger */}
                          <AiDiagnostics 
                            workflowName={selectedExecution.workflowName} 
                            nodeName={selectedExecution.errorNodeName || 'Unknown Node'} 
                            nodeType="n8n-nodes-base.httpRequest" // default node type for diagnostics
                            errorMessage={selectedExecution.errorMessage || 'Unknown stack error.'}
                          />
                        </div>
                      ) : selectedExecution.status === 'success' ? (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wide">Ejecución Exitosa</span>
                          <p className="text-[11px] text-zinc-300">Todos los nodos procesados de forma secuencial sin fallas de origen.</p>
                          <div className="text-[10px] text-zinc-500 font-mono mt-2">
                            MIME: application/json<br />
                            Bytes: {(selectedExecution.dataSizeKb || 24) * 1024}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-center gap-3">
                          <RotateCw className="w-5 h-5 text-sky-400 animate-spin" />
                          <span className="text-xs text-zinc-300">Procesando cola en tiempo real...</span>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-500">
                      <Info className="w-8 h-8 text-zinc-600 mb-2" />
                      <span className="text-xs font-semibold">Ninguna ejecución seleccionada</span>
                      <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">Haz clic en cualquier fila de la tabla para ver su diagnóstico detallado.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ERROR CENTER PANEL */}
          {activeTab === 'errores' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-lg font-extrabold tracking-tight text-white">Centro de Errores e Incidentes</h2>
                <p className="text-xs text-zinc-500">Analiza qué nodos e integraciones están causando caídas de flujos</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Error Node breakdown chart */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between h-[300px]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Nodos con Mayor Tasa de Falla</h3>
                    <p className="text-[10px] text-zinc-500">Identifica cuellos de botella en integraciones de API</p>
                  </div>
                  
                  {errorNodeTypeData.length > 0 ? (
                    <div className="flex-1 w-full min-h-[160px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={errorNodeTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {errorNodeTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip contentStyle={customTooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
                      Sin fallas registradas en esta sesión.
                    </div>
                  )}
                </div>

                {/* Resilience Recommendations */}
                <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Políticas de Resiliencia en N8N</h3>
                  <p className="text-[11px] text-zinc-400">Prácticas recomendadas para evitar fallas absolutas en entornos de producción:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-violet-400 font-semibold">
                        <Zap className="w-4 h-4" />
                        <span>Configurar Retry (Reintentos)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Habilite el reintento automático en nodos HTTP y externos (p. ej. Stripe, Hubspot) con intervalos exponenciales para mitigar cuellos de botella por Rate Limits (Error 429).
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-sky-400 font-semibold">
                        <Layers className="w-4 h-4" />
                        <span>Nodo Error Trigger</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Cree un flujo global de captura de errores usando el disparador **Error Trigger**. Enrute cualquier alerta crítica hacia Slack o Teams con el stacktrace.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Full Detailed Incidents List */}
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Bitácora General de Alertas</h3>
                
                <div className="space-y-3">
                  {errors.map((err) => (
                    <div 
                      key={err.id} 
                      className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-zinc-700/80 transition flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[9px] font-mono text-rose-400 font-bold uppercase">
                            Error
                          </span>
                          <h4 className="text-xs font-bold text-white">{err.workflowName}</h4>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-500">{new Date(err.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950 border border-zinc-900 p-2 rounded">
                          {err.message}
                        </p>
                        <div className="text-[10px] text-zinc-500">
                          Nodo afectado: <span className="text-white font-mono">{err.nodeName}</span> ({err.nodeType})
                        </div>
                      </div>

                      <div className="flex items-start md:items-end flex-col gap-2 flex-shrink-0 justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          err.severity === 'high' ? 'bg-orange-950/40 border-orange-500 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}>
                          Gravedad {err.severity === 'high' ? 'Alta' : 'Media'}
                        </span>
                        
                        <button
                          onClick={() => {
                            const relatedExec = executions.find(e => e.id === err.executionId) || {
                              id: err.executionId,
                              workflowId: err.workflowId,
                              workflowName: err.workflowName,
                              status: 'failed',
                              mode: 'webhook',
                              startedAt: err.timestamp,
                              durationMs: 1450,
                              errorMessage: err.message,
                              errorNodeName: err.nodeName
                            };
                            setSelectedExecution(relatedExec);
                            setActiveTab('ejecuciones');
                          }}
                          className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-[10px] font-medium"
                        >
                          Ir al Diagnóstico
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: CONNECTION / JSON PANEL */}
          {activeTab === 'conexion' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-lg font-extrabold tracking-tight text-white">Sincronización y Carga de Datos</h2>
                <p className="text-xs text-zinc-500">Conecta tu consola a un servidor n8n en vivo o importa un reporte JSON</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Live REST API Panel */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Conectar Instancia n8n</h3>
                      <p className="text-[10px] text-zinc-500">Conexión directa mediante REST API oficial de n8n</p>
                    </div>
                  </div>

                  <form onSubmit={handleTestConnection} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">URL del Servidor N8N</label>
                      <input
                        type="text"
                        value={n8nUrl}
                        onChange={(e) => setN8nUrl(e.target.value)}
                        placeholder="e.g. https://n8n.mycompany.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">API Key de N8N</label>
                      <input
                        type="password"
                        value={n8nApiKey}
                        onChange={(e) => setN8nApiKey(e.target.value)}
                        placeholder="N8N_API_KEY_..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={connectionStatus === 'connecting'}
                        className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-xl transition"
                      >
                        {connectionStatus === 'connecting' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Estableciendo Conexión...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Sincronizar Instancia
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Feedback response */}
                  {connectionStatus === 'connected' && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Conectado correctamente. Datos de flujos actualizados.</span>
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-900/40 text-rose-300 text-[11px] leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-2 font-bold">
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>Error de Conexión</span>
                      </div>
                      <p>{connectionError}</p>
                    </div>
                  )}
                </div>

                {/* Upload JSON Export Panel */}
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cargar Archivo de Ejecuciones JSON</h3>
                      <p className="text-[10px] text-zinc-500">Carga sin límites ni problemas de CORS de navegador</p>
                    </div>
                  </div>

                  {/* Drag drop zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      dragActive ? 'border-violet-500 bg-violet-950/10' : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-500" />
                    <div>
                      <span className="text-xs text-white font-semibold">Arrastre el archivo JSON aquí</span>
                      <p className="text-[10px] text-zinc-500 mt-1">O haga clic para buscar el archivo en su dispositivo</p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileInput}
                      className="hidden"
                      id="json-file-input"
                    />
                    <label
                      htmlFor="json-file-input"
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[10px] font-semibold transition cursor-pointer border border-zinc-700"
                    >
                      Buscar Archivo
                    </label>
                  </div>

                  {importMessage && (
                    <div className={`p-3 rounded-xl text-xs border ${
                      importMessage.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' :
                      importMessage.type === 'error' ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' :
                      'bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}>
                      {importMessage.text}
                    </div>
                  )}

                  <div className="p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                    <span className="font-semibold text-white block">¿Cómo descargar el historial de n8n?</span>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Abra su instancia de N8N en otra pestaña.</li>
                      <li>Diríjase a la sección **Workflows** o **Executions**.</li>
                      <li>Haga clic en el botón de descarga/exportar para obtener el historial en formato JSON.</li>
                      <li>Cárguelo aquí para procesar métricas en tiempo real.</li>
                    </ol>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* Footer copyright */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950/90 text-center py-4 text-[10px] text-zinc-600 font-mono tracking-wide">
        Portal de Diagnóstico N8N • Impulsado por Gemini 3.5 Flash • {new Date().getFullYear()}
      </footer>

    </div>
  );
}

// Render app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
