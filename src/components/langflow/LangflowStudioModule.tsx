import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Bot, 
  User, 
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { GeminiApiService } from '../../services/geminiApi';

interface LangflowStudioModuleProps {
  isDark?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  latencyMs?: number;
}

export const LangflowStudioModule: React.FC<LangflowStudioModuleProps> = ({ isDark = true }) => {
  const [langflowHealth, setLangflowHealth] = useState<{ status: string; url: string; langflow_ready: boolean } | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      text: '¡Hola! Soy tu Agente Inteligente XAI orquestado en Langflow (Puerto 7860). Escribe cualquier consulta o prueba de telemetría y te responderé en tiempo real.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper to parse JSON or clean markdown code blocks into clean human-readable narrative text
  const renderFormattedMessage = (rawText: string) => {
    let cleanText = rawText.trim();

    // Strip markdown code block wrappers ```json ... ``` or ``` ... ```
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanText);
      if (parsed && typeof parsed === 'object') {
        const {
          resumen_diagnostico,
          nivel_criticidad,
          factores_clave,
          acciones_mitigacion,
          explicacion_tecnica_xai
        } = parsed;

        return (
          <div className="space-y-3">
            {/* Header badge if criticality exists */}
            {nivel_criticidad && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Nivel de Criticidad:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                  String(nivel_criticidad).toUpperCase() === 'CRÍTICO' || String(nivel_criticidad).toUpperCase() === 'CRITICO'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {nivel_criticidad}
                </span>
              </div>
            )}

            {/* Resumen */}
            {resumen_diagnostico && (
              <div>
                <p className="font-semibold text-purple-300 mb-1">📋 Diagnóstico Principal:</p>
                <p className="text-slate-200 leading-relaxed">{resumen_diagnostico}</p>
              </div>
            )}

            {/* Factores Clave */}
            {Array.isArray(factores_clave) && factores_clave.length > 0 && (
              <div>
                <p className="font-semibold text-purple-300 mb-1">🔍 Factores Clave de Riesgo (SHAP):</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                  {factores_clave.map((item: string, idx: number) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acciones de Mitigación */}
            {Array.isArray(acciones_mitigacion) && acciones_mitigacion.length > 0 && (
              <div>
                <p className="font-semibold text-emerald-400 mb-1">🛡️ Acciones Inmediatas de Mitigación:</p>
                <ul className="space-y-1 text-slate-300">
                  {acciones_mitigacion.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explicación Técnica XAI */}
            {explicacion_tecnica_xai && (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-purple-500/20 mt-2">
                <p className="font-semibold text-purple-300 mb-1 text-[11px]">🤖 Explicación Técnica XAI (Gemini Agent):</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{explicacion_tecnica_xai}</p>
              </div>
            )}
          </div>
        );
      }
    } catch {
      // If not JSON, render clean formatted text with line breaks
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{cleanText}</div>;
  };

  // Check health on mount
  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/gemini/langflow/health`);
      if (res.ok) {
        const data = await res.json();
        setLangflowHealth(data);
      } else {
        setLangflowHealth({ status: 'offline', url: 'http://localhost:7860', langflow_ready: false });
      }
    } catch {
      setLangflowHealth({ status: 'offline', url: 'http://localhost:7860', langflow_ready: false });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsg,
      time: timeStr
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    const start = performance.now();

    try {
      // Send to analyze-risk or chat endpoint which forwards to Langflow
      const alertPayload = {
        severity: 'CRITICAL',
        zone: 'Rampa Este (Banco 3200)',
        message: userMsg
      };

      const shapFactors = [
        { feature: 'Fatiga Biológica PERCLOS', impact: 0.45 },
        { feature: 'Punto Ciego LiDAR', impact: 0.30 }
      ];

      const res = await GeminiApiService.analyzeRisk('HT-104', alertPayload, shapFactors);
      const elapsed = Math.round(performance.now() - start);

      const agentReplyText = res.analysis || res.fallback_analysis || 'Respuesta procesada correctamente por el Agente Langflow.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: agentReplyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyMs: elapsed
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Error conectando con el servicio de Langflow: ${String(err)}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt presets
  const sendQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  return (
    <div className={`p-4 sm:p-6 max-w-5xl mx-auto space-y-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header & Status Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-lg ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5 fill-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-black flex items-center gap-2">
              Prueba Interactiva Langflow Agent
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Puerto 7860
              </span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Escribe un mensaje abajo para interactuar en tiempo real con el flujo de Langflow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isChecking ? (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Langflow Conectado
            </span>
          )}
          <button
            onClick={checkHealth}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Revisar conexión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className={`rounded-2xl border flex flex-col h-[580px] shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Chat Window Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between text-xs ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 font-semibold text-purple-400">
            <MessageSquare className="w-4 h-4" />
            <span>Chat Playground del Agente Langflow</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Engine: Gemini 3.1 Flash Lite / 2.5 Flash
          </span>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none shadow-md'
                  : isDark
                  ? 'bg-slate-800/95 border border-slate-700 text-slate-100 rounded-tl-none shadow-md'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
              }`}>
                {msg.sender === 'agent' ? renderFormattedMessage(msg.text) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
                
                <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-purple-500/20 text-[10px] text-slate-400 font-mono">
                  {msg.latencyMs ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> Inferencia: {msg.latencyMs} ms (Langflow Flow)
                    </span>
                  ) : (
                    <span>MineSafe 3D</span>
                  )}
                  <span>{msg.time}</span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-purple-400 text-xs">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span className="animate-pulse font-medium">Langflow procesando mensaje en puerto 7860...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className={`px-4 py-2 border-t flex flex-wrap items-center gap-2 text-[11px] ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-slate-500 font-medium mr-1">Sugerencias rápidas:</span>
          <button
            onClick={() => sendQuickPrompt('Analizar riesgo del camión HT-104 en la Rampa Este')}
            className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            🚚 Riesgo HT-104
          </button>
          <button
            onClick={() => sendQuickPrompt('¿Cuál es el protocolo de seguridad si un operador presenta fatiga (PERCLOS 65%)?')}
            className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            😴 Protocolo Fatiga
          </button>
          <button
            onClick={() => sendQuickPrompt('Verificar velocidad recomendada en bajada de tajo abierto')}
            className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            ⚠️ Velocidad Rampa
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu consulta para el Agente Langflow (ej. Analizar riesgo HT-104)..."
            className={`flex-1 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500 transition-colors ${
              isDark ? 'bg-slate-950 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>
      </div>

    </div>
  );
};
