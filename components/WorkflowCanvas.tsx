/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { N8nWorkflow, N8nNode } from '../types';
import { getNodeColorClass } from '../data';
import { 
  Webhook, 
  Clock, 
  Mail, 
  Database, 
  Cpu, 
  MessageSquare, 
  Network, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  Workflow,
  AlertTriangle
} from 'lucide-react';

interface WorkflowCanvasProps {
  workflow: N8nWorkflow;
  failedNodeName?: string;
  onSelectNode?: (node: N8nNode) => void;
}

// Map node types to beautiful Lucide icons
export const getNodeIcon = (type: string, className = "w-5 h-5") => {
  const t = type.toLowerCase();
  if (t.includes('webhook')) return <Webhook className={className} />;
  if (t.includes('cron') || t.includes('schedule') || t.includes('interval')) return <Clock className={className} />;
  if (t.includes('gmail') || t.includes('email') || t.includes('mailchimp')) return <Mail className={className} />;
  if (t.includes('postgres') || t.includes('database') || t.includes('mysql') || t.includes('redis')) return <Database className={className} />;
  if (t.includes('googlegenai') || t.includes('openai') || t.includes('anthropic') || t.includes('ai')) return <Cpu className={className} />;
  if (t.includes('slack') || t.includes('twilio') || t.includes('telegram')) return <MessageSquare className={className} />;
  if (t.includes('switch') || t.includes('if') || t.includes('router') || t.includes('merge')) return <Network className={className} />;
  return <Workflow className={className} />;
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  workflow, 
  failedNodeName,
  onSelectNode 
}) => {
  const { nodes, connections } = workflow;

  // Find node by name helper
  const findNodeByName = (name: string) => nodes.find(n => n.name === name);

  // Parse connections to build line coordinate array
  const lines: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    status: 'success' | 'failed' | 'idle';
  }> = [];

  Object.entries(connections).forEach(([sourceName, sourceConnections]) => {
    const sourceNode = findNodeByName(sourceName);
    if (!sourceNode) return;

    // Check outputs on main branch
    const mainOutputs = sourceConnections.main || [];
    mainOutputs.forEach((outputGroup) => {
      outputGroup.forEach((output) => {
        const targetNode = findNodeByName(output.node);
        if (!targetNode) return;

        // Node dimensions are approx 180x70. Adjust anchor points to edges
        const x1 = sourceNode.position[0] + 180;
        const y1 = sourceNode.position[1] + 35;
        const x2 = targetNode.position[0];
        const y2 = targetNode.position[1] + 35;

        // Determine line status based on nodes
        let status: 'success' | 'failed' | 'idle' = 'idle';
        if (sourceNode.status === 'success' && targetNode.status === 'success') {
          status = 'success';
        } else if (sourceNode.status === 'success' && targetNode.status === 'failed') {
          status = 'failed';
        } else if (sourceNode.status === 'success' && targetNode.status === 'idle') {
          status = 'idle';
        }

        lines.push({
          id: `${sourceNode.id}-${targetNode.id}`,
          x1,
          y1,
          x2,
          y2,
          status
        });
      });
    });
  });

  // Calculate SVG viewport boundaries to fit nodes beautifully
  const xPositions = nodes.map(n => n.position[0]);
  const yPositions = nodes.map(n => n.position[1]);
  const minX = Math.min(...xPositions, 0) - 50;
  const maxX = Math.max(...xPositions, 1000) + 240;
  const minY = Math.min(...yPositions, 0) - 50;
  const maxY = Math.max(...yPositions, 400) + 120;

  const viewWidth = maxX - minX;
  const viewHeight = maxY - minY;

  return (
    <div className="relative w-full overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800/80 p-6 shadow-inner select-none">
      <div 
        className="relative" 
        style={{ 
          width: `${maxX - minX}px`, 
          height: `${maxY - minY}px`,
          transformOrigin: '0 0'
        }}
      >
        {/* Background Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#10b981" />
            </marker>
            <marker id="arrow-failed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-idle" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#71717a" />
            </marker>
          </defs>

          {lines.map((line) => {
            // Draw smooth cubic bezier cables
            const dx = Math.abs(line.x2 - line.x1) * 0.5;
            const pathData = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;

            let strokeColor = '#52525b'; // zinc-600
            let markerId = 'arrow-idle';
            let strokeDash = 'none';

            if (line.status === 'success') {
              strokeColor = '#10b981'; // emerald-500
              markerId = 'arrow-success';
            } else if (line.status === 'failed') {
              strokeColor = '#ef4444'; // rose-500
              markerId = 'arrow-failed';
              strokeDash = '4,4';
            }

            return (
              <g key={line.id}>
                {/* Background glow line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="5"
                  className="opacity-15 blur-sm"
                />
                {/* Main line cable */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={strokeDash}
                  markerEnd={`url(#${markerId})`}
                  className={line.status === 'success' ? 'animate-[dash_10s_linear_infinite]' : ''}
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isNodeFailed = node.name === failedNodeName || node.status === 'failed';
          const isNodeSuccess = node.status === 'success';
          const colorClass = getNodeColorClass(node.type, isNodeFailed ? 'failed' : node.status);
          const icon = getNodeIcon(node.type);

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode && onSelectNode(node)}
              className={`absolute w-[200px] h-[75px] rounded-xl border flex flex-col justify-between p-3 cursor-pointer transition-all duration-300 shadow-lg group hover:scale-[1.03] hover:shadow-xl ${colorClass} ${
                isNodeFailed ? 'ring-2 ring-rose-500/80 animate-[pulse_1.5s_infinite]' : 'hover:border-white/40'
              }`}
              style={{
                left: `${node.position[0] - minX}px`,
                top: `${node.position[1] - minY}px`,
              }}
            >
              {/* Header: Icon and Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="opacity-90 group-hover:opacity-100">{icon}</div>
                  <span className="text-[10px] font-mono tracking-wider opacity-60 group-hover:opacity-80 truncate max-w-[110px]">
                    {node.type.split('.').pop()}
                  </span>
                </div>
                <div>
                  {isNodeFailed && <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />}
                  {isNodeSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {node.status === 'idle' && <div className="w-2 h-2 rounded-full bg-zinc-500" />}
                </div>
              </div>

              {/* Node Name */}
              <div className="text-xs font-semibold tracking-tight text-white/95 truncate">
                {node.name}
              </div>

              {/* Highlight Overlay on Hover */}
              <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
