import React, { useState, useEffect } from 'react';
import { GeminiApiService, GeminiHealthResponse } from '../../services/geminiApi';
import { Bot, Send, Sparkles, AlertCircle, CheckCircle2, RefreshCw, X, Shield, Cpu } from 'lucide-react';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEquipmentContext?: any;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentEquipmentContext
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'gemini'; text: string; time: string }>>([
    {
      sender: 'gemini',
      text: '¡Hola! Soy Gemini Minero AI, amarrado como motor de backend en FastAPI. ¿En qué puedo asistirte con el Gemelo Digital 3D, alertas de fatiga o explicabilidad XAI?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<GeminiHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkHealthStatus = async () => {
    setIsCheckingHealth(true);
    const data = await GeminiApiService.checkHealth();
    setHealth(data);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkHealthStatus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setInputMessage('');
    setIsLoading(true);

    const res = await GeminiApiService.chat(userText, currentEquipmentContext);
    const replyTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, {
      sender: 'gemini',
      text: res.reply || 'No se obtuvo respuesta del motor de backend.',
      time: replyTimeStr
    }]);

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Motor Gemini AI (FastAPI Backend)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-normal">
                  v1.0 Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">Asistente XAI y Telemetría Minera en Tiempo Real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Bar */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>FastAPI: <code className="text-amber-300">http://localhost:8000/api/gemini</code></span>
          </div>
          <div className="flex items-center gap-2">
            {isCheckingHealth ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : health?.gemini_api_key_configured ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Key Gemini Conectada ({health.model})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" /> Backend accesible / API Key lista
              </span>
            )}
            <button
              onClick={checkHealthStatus}
              className="text-slate-400 hover:text-indigo-400 ml-1"
              title="Revisar conexión"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-900/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'gemini' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span className="animate-pulse">Gemini FastAPI procesando respuesta...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-800/80 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pregunta sobre la telemetría, alertas SHAP o estado de la mina..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
