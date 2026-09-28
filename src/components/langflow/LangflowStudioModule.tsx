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
          <div className="space-y-3 text-[var(--text)]">
            {/* Header badge if criticality exists */}
            {nivel_criticidad && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-muted)]">Nivel de Criticidad:</span>
                <span className={`text-[10px] ${
                  String(nivel_criticidad).toUpperCase() === 'CRÍTICO' || String(nivel_criticidad).toUpperCase() === 'CRITICO'
                    ? 'ms-badge-risk-critical'
                    : 'ms-badge-risk-high'
                }`}>
                  {nivel_criticidad}
                </span>
              </div>
            )}

            {/* Resumen */}
            {resumen_diagnostico && (
              <div>
                <p className="font-semibold text-xs mb-1 text-[var(--text)]">Diagnóstico principal:</p>
                <p className="leading-relaxed text-[var(--text-muted)]">{resumen_diagnostico}</p>
              </div>
            )}

            {/* Factores Clave */}
            {Array.isArray(factores_clave) && factores_clave.length > 0 && (
              <div>
                <p className="font-semibold text-xs mb-1 text-[var(--text)]">Factores clave (SHAP):</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[var(--text-muted)]">
                  {factores_clave.map((item: string, idx: number) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acciones de Mitigación */}
            {Array.isArray(acciones_mitigacion) && acciones_mitigacion.length > 0 && (
              <div>
                <p className="font-semibold text-xs mb-1 text-[var(--text)]">Acciones recomendadas:</p>
                <ul className="space-y-1 text-[var(--text-muted)]">
                  {acciones_mitigacion.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--accent)] font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explicación Técnica XAI */}
            {explicacion_tecnica_xai && (
              <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] mt-2 bg-[var(--surface)]">
                <p className="font-medium mb-1 text-[11px] text-[var(--text)]">Explicación técnica:</p>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{explicacion_tecnica_xai}</p>
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 text-[var(--text)]">
      
      {/* Header & Status Bar */}
      <div className="ms-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Agente Langflow
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-faint)]">
                Puerto 7860
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Playground de interacción e inferencia en tiempo real para análisis RAG.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isChecking ? (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando...
            </span>
          ) : langflowHealth?.langflow_ready !== false ? (
            <span className="text-xs font-medium text-[var(--success)] flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--success)]/10 border border-[var(--success)]/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
            </span>
          ) : (
            <span className="text-xs font-medium text-[var(--danger)] flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--danger)]/10 border border-[var(--danger)]/20">
              <AlertCircle className="w-3.5 h-3.5" /> Desconectado
            </span>
          )}

          <button
            onClick={checkHealth}
            className="ms-button-neutral p-1.5"
            title="Revisar conexión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href="http://localhost:7860"
            target="_blank"
            rel="noopener noreferrer"
            className="ms-button-neutral px-2.5 py-1 text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en pestaña nueva</span>
          </a>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="ms-card flex flex-col h-[580px] overflow-hidden">
        
        {/* Chat Window Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between text-xs bg-[var(--surface-2)]">
          <div className="flex items-center gap-2 font-medium text-[var(--text)]">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            <span>Consola de Consulta RAG</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">
            Engine: Gemini 3.1 Flash / 2.5 Flash
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
                <div className="w-7 h-7 rounded-[var(--radius-control)] border border-[var(--border)] flex items-center justify-center shrink-0 bg-[var(--surface-2)] text-[var(--accent)]">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-[var(--radius-card)] p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--text)]'
                  : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]'
              }`}>
                {msg.sender === 'agent' ? renderFormattedMessage(msg.text) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
                
                <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-faint)]">
                  {msg.latencyMs ? (
                    <span className="font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[var(--accent)]" />
                      <span>Inferencia: <span className="font-mono text-[var(--text)]">{msg.latencyMs} ms</span></span>
                    </span>
                  ) : (
                    <span>MineSafe 3D</span>
                  )}
                  <span className="font-mono">{msg.time}</span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-[var(--radius-control)] border border-[var(--border)] flex items-center justify-center shrink-0 bg-[var(--surface-2)] text-[var(--text-muted)]">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-[var(--text-muted)]">
              <div className="w-7 h-7 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="font-mono text-[11px]">Procesando flujo en puerto 7860...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-xs bg-[var(--surface)]">
          <span className="text-[11px] text-[var(--text-faint)] mr-1">Sugerencias:</span>
          <button
            onClick={() => sendQuickPrompt('Analizar riesgo del camión HT-104 en la Rampa Este')}
            className="ms-button-neutral text-[11px] px-2.5 py-1"
          >
            Riesgo camión HT-104
          </button>
          <button
            onClick={() => sendQuickPrompt('¿Cuál es el protocolo de seguridad si un operador presenta fatiga (PERCLOS 65%)?')}
            className="ms-button-neutral text-[11px] px-2.5 py-1"
          >
            Protocolo de fatiga
          </button>
          <button
            onClick={() => sendQuickPrompt('Verificar velocidad recomendada en bajada de tajo abierto')}
            className="ms-button-neutral text-[11px] px-2.5 py-1"
          >
            Velocidad en rampa
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border)] flex gap-2 bg-[var(--surface-2)]">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe una consulta para el Agente Langflow..."
            className="ms-input flex-1 text-xs"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="ms-button-primary disabled:opacity-40 px-4 py-2 flex items-center gap-1.5 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>

    </div>
  );
};
