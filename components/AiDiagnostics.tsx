/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, CheckCircle, ShieldAlert, AlertCircle, Copy, Check } from 'lucide-react';

interface AiDiagnosticsProps {
  workflowName: string;
  nodeName: string;
  nodeType: string;
  errorMessage: string;
  errorStack?: string;
}

export const AiDiagnostics: React.FC<AiDiagnosticsProps> = ({
  workflowName,
  nodeName,
  nodeType,
  errorMessage,
  errorStack
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error('API_KEY is not configured in the workspace environment.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
Eres un experto de soporte y DevOps especializado en N8N, automatización de flujos y APIs.
Analiza el siguiente error que ocurrió en un flujo de N8N y genera un REPORTE DE DIAGNÓSTICO INTEGRAL Y SOLUCIÓN en español.

DETALLES DEL FLUJO Y ERROR:
- Flujo (Workflow): "${workflowName}"
- Nodo que Falló: "${nodeName}" (Tipo de nodo: "${nodeType}")
- Mensaje de Error: "${errorMessage}"
- Stack Trace: "${errorStack || 'No disponible'}"

Por favor, estructura tu respuesta con los siguientes puntos y usa Markdown limpio:
1. **¿Qué significa este error?** (Explica de forma clara y sencilla el problema, sin excesivo tecnicismo).
2. **Causa raíz más probable** (Enumera las causas comunes por las cuales este nodo específico suele fallar con este mensaje).
3. **Pasos detallados para solucionarlo en N8N** (Proporciona una lista de 3-4 pasos numerados prácticos que el usuario debe hacer en su interfaz de N8N, por ejemplo: refrescar credenciales OAuth, verificar parámetros, ajustar límites, etc.).
4. **Recomendación de Resiliencia** (Sugerencia para evitar que falle en el futuro, como configurar "On Error: Continue/Retry" en N8N).

Mantén un tono profesional, alentador y sumamente claro.
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          systemInstruction: 'Eres un asistente experto en ingeniería de confiabilidad n8n.'
        }
      });

      const text = response.text;
      if (text) {
        setAnalysis(text);
      } else {
        throw new Error('No se recibió análisis de la API de Gemini.');
      }
    } catch (err: any) {
      console.error('Error in Gemini Diagnostics:', err);
      setError(err.message || 'Error al conectar con el servicio de análisis de Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render markdown line-by-line beautifully with icons
  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###') || trimmed.startsWith('####')) {
        return (
          <h4 key={index} className="text-sm font-semibold text-white mt-4 mb-2 flex items-center gap-1.5 border-b border-zinc-800 pb-1">
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        return (
          <h3 key={index} className="text-base font-bold text-violet-400 mt-5 mb-2.5 flex items-center gap-2">
            {trimmed.replace(/^#+\s*/, '')}
          </h3>
        );
      }

      // Code blocks
      if (trimmed.startsWith('```')) {
        return null; // Skip raw code fence markers
      }

      // Ordered Lists / Steps
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={index} className="flex gap-3 my-2 pl-1">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-950 border border-violet-500/50 text-violet-300 flex items-center justify-center text-[11px] font-mono font-bold mt-0.5">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <p className="text-zinc-300 text-xs leading-relaxed">
              {trimmed.replace(/^\d+\.\s*\**\s*/, '').replace(/\**/g, '')}
            </p>
          </div>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <div key={index} className="flex items-start gap-2 my-1.5 pl-3">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
            <p className="text-zinc-300 text-xs leading-relaxed">
              {trimmed.replace(/^[-*]\s*\**\s*/, '').replace(/\**/g, '')}
            </p>
          </div>
        );
      }

      // Normal text / Bold formatting support
      if (trimmed.length === 0) return <div key={index} className="h-2" />;

      // Highlight bold text
      const parts = line.split('**');
      if (parts.length > 1) {
        return (
          <p key={index} className="text-zinc-300 text-xs leading-relaxed my-1.5">
            {parts.map((part, pIdx) => 
              pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part
            )}
          </p>
        );
      }

      return (
        <p key={index} className="text-zinc-300 text-xs leading-relaxed my-1.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 mt-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-950 text-violet-400 border border-violet-800/50">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Diagnóstico de Errores con IA</h4>
            <p className="text-[10px] text-zinc-500">Usa Gemini para analizar la causa raíz y obtener la solución</p>
          </div>
        </div>
        
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition shadow-md hover:shadow-violet-600/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analizar Error
          </button>
        )}

        {analysis && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              title="Copiar informe"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleAnalyze}
              className="text-[10px] text-violet-400 hover:text-violet-300 font-medium hover:underline"
            >
              Reanalizar
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Gemini está analizando los registros de ejecución...</span>
          <p className="text-[9px] text-zinc-600 max-w-[280px]">Revisando logs de error, tipo de nodo y credenciales de conexión en N8N</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">No se pudo generar el diagnóstico:</span>
            <p className="text-[11px] text-rose-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-1 overflow-y-auto max-h-[350px] pr-1.5 scrollbar-thin">
          <div className="flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 p-2 rounded-lg mb-3 text-[10px]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Diagnóstico completado exitosamente por Gemini 3.5 Flash</span>
          </div>
          <div className="prose prose-invert prose-xs max-w-none">
            {formatAnalysis(analysis)}
          </div>
        </div>
      )}
    </div>
  );
};
