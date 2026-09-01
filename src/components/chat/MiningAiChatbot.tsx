import React, { useState, useRef, useEffect } from 'react';
import { Equipment, CollisionAlert, UserRole, MiningScenario } from '../../types/mining';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2, 
  ShieldAlert, 
  Activity, 
  Flame, 
  CheckCircle2, 
  ChevronRight,
  Radio,
  Volume2,
  Trash2,
  HelpCircle,
  Clock,
  Zap,
  Users
} from 'lucide-react';

interface MiningAiChatbotProps {
  equipments: Equipment[];
  alerts: CollisionAlert[];
  currentRole: UserRole;
  weatherCondition: 'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN';
  onSendCabWarning?: (equipmentId: string) => void;
  onRequestRelief?: (operatorId: string) => void;
  onActivateScenario?: (scenarioId: string) => void;
  theme?: 'dark' | 'light';
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  badge?: string;
  actions?: { label: string; actionId: string; type: 'warning' | 'relief' | 'scenario' }[];
}

export const MiningAiChatbot: React.FC<MiningAiChatbotProps> = ({
  equipments,
  alerts,
  currentRole,
  weatherCondition,
  onSendCabWarning,
  onRequestRelief,
  onActivateScenario,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessages: ChatMessage[] = [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `👋 **¡Hola! Soy MineSafe Copilot**, tu asistente de inteligencia artificial para el Gemelo Digital 3D en Tajo Abierto.\n\nPuedo responder consultas sobre **telemetría en vivo**, calcular **factores SHAP**, explicar **tiempos de reacción frente al PDS** o ejecutar **protocolos de mitigación en cabina** para la flota mixta.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: 'IA OPERACIONAL & HSE',
      actions: [
        { label: 'Analizar equipo más crítico (HT-104)', actionId: 'check_critical', type: 'warning' },
        { label: '¿Cómo funciona la Hipótesis H1 (+255%)?', actionId: 'explain_h1', type: 'scenario' },
        { label: 'Protocolo de Fatiga y Relevo', actionId: 'fatigue_protocol', type: 'relief' },
      ],
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Quick suggestions chips
  const suggestionChips = [
    '¿Cuál es el camión con mayor riesgo actual?',
    'Explicar desglose SHAP de HT-104',
    '¿Por qué el Gemelo Digital supera al PDS estándar?',
    'Enviar aviso sonoro preventivo a cabina',
    'Solicitar relevo por fatiga PERCLOS',
    '¿Cómo se garantiza la privacidad ética de los operadores?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(query);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'check_critical') {
      handleSendMessage('¿Cuál es el camión con mayor riesgo actual?');
    } else if (actionId === 'explain_h1') {
      handleSendMessage('¿Por qué el Gemelo Digital supera al PDS estándar?');
    } else if (actionId === 'fatigue_protocol') {
      handleSendMessage('Solicitar relevo por fatiga PERCLOS');
    } else if (actionId === 'cab_warning_ht104') {
      onSendCabWarning?.('eq-ht-104');
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `🚨 **Aviso emitido**: Señal acústica y háptica transmitida a la cabina de HT-104 (Operador Carlos Méndez).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (actionId === 'relief_ht104') {
      onRequestRelief?.('op-104');
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `✅ **Relevo solicitado**: Despacho de Turno ha asignado un operador de reemplazo para HT-104 en el próximo pase del banco 3200.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const generateBotResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Critical Equipment status
    if (q.includes('riesgo') || q.includes('mayor riesgo') || q.includes('crítico') || q.includes('ht-104')) {
      const ht104 = equipments.find((e) => e.id === 'eq-ht-104');
      const riskScore = ht104 ? (ht104.currentPrediction.overallRiskScore * 100).toFixed(0) : '88';
      const perclos = ht104?.assignedOperator ? (ht104.assignedOperator.perclosScore * 100).toFixed(0) : '38';
      const hours = ht104?.assignedOperator ? ht104.assignedOperator.shiftHoursAccumulated : 10.8;

      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Diagnóstico de Flota en Tiempo Real:**\n\nEl equipo con mayor índice de riesgo es el **${ht104?.code || 'HT-104'}** (Caterpillar 797F) en la **Rampa Este - Banco 3200**:\n\n- **Score de Riesgo Global:** \`${riskScore}%\` (Nivel ${ht104?.currentPrediction.riskLevel || 'CRITICAL'})\n- **Tiempo a Colisión (TTC):** \`${ht104?.currentPrediction.timeToCollisionSec.toFixed(1) || '6.2'} segundos\`\n- **Estado Operador:** Carlos Méndez con **${hours} horas acumuladas** y PERCLOS al **${perclos}%** (Somnolencia confirmada).\n- **Trayectoria:** Convergente frente a camión autónomo AHS-02 en curva de visibilidad restringida.`,
        timestamp: timeNow,
        badge: 'DIAGNÓSTICO XAI',
        actions: [
          { label: '📢 Enviar Aviso Acústico a Cabina', actionId: 'cab_warning_ht104', type: 'warning' },
          { label: '🛑 Gestionar Relevo Inmediato', actionId: 'relief_ht104', type: 'relief' },
        ],
      };
    }

    // 2. SHAP Explanation
    if (q.includes('shap') || q.includes('explicabilidad') || q.includes('factores') || q.includes('tree')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🧠 **Explicabilidad Fast TreeSHAP en MineSafe 3D:**\n\nEl modelo fusiona 4 vectores multimodales y calcula la contribución marginal de cada variable:\n\n1. **Fatiga del Operador (65% del riesgo):** Cierre ocular PERCLOS elevado + 10.8 horas continuas en turno noche.\n2. **Cinemática GNSS (18% del riesgo):** Velocidad de acarreo en descenso (34 km/h en pendiente del 8.5%).\n3. **Percepción LiDAR (12% del riesgo):** Distancia proyectada al obstáculo (42 metros) con atenuación por polvo.\n4. **Inestabilidad de Maniobra (5%):** Variabilidad en volante y correcciones tardías.\n\n💡 **Recomendación Contrafáctica:** Si el operador reduce la velocidad a 22 km/h o es relevado, el score cae de 88% a 14% (Riesgo Bajo).`,
        timestamp: timeNow,
        badge: 'XAI TREESHAP',
      };
    }

    // 3. Hypothesis H1 / PDS Comparison
    if (q.includes('pds') || q.includes('h1') || q.includes('anticipacion') || q.includes('comparativa') || q.includes('superioridad')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🎯 **Validación de la Hipótesis H1 (Gemelo Digital vs PDS):**\n\n- **MineSafe 3D (Gemelo Digital):** Emite la alerta con **6.4 segundos de anticipación media** gracias a la fusión predictiva de trayectorias y comportamiento del operador.\n- **Sistemas PDS Estándar:** Reaccionan típicamente a **1.8 segundos** (basados únicamente en proximidad geométrica por radar/cámaras).\n\n🚀 **Ganancia Operacional:** **+255% de tiempo adicional de reacción (+4.6s)**, permitiendo a los camiones de 400 toneladas frenar de manera suave y segura sin pérdida de control en rampa.`,
        timestamp: timeNow,
        badge: 'BENCHMARK VALIDADO',
      };
    }

    // 4. Cabin warning / dispatch
    if (q.includes('aviso') || q.includes('cabina') || q.includes('sonar') || q.includes('alerta')) {
      onSendCabWarning?.('eq-ht-104');
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🚨 **Comando Ejecutado:** Se ha enviado una señal de alerta con tono sonoro trifásico y vibración de volante a la cabina del camión **HT-104**.\n\nEl sistema V2V del camión autónomo AHS-02 adyacente también ha recibido la instrucción de reducir velocidad a modo precautorio.`,
        timestamp: timeNow,
        badge: 'INTERVENCIÓN TELEMÉTRICA',
      };
    }

    // 5. Fatigue relief
    if (q.includes('relevo') || q.includes('fatiga') || q.includes('perclos') || q.includes('descanso')) {
      onRequestRelief?.('op-104');
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `✅ **Protocolo de Fatiga Activado:** Se generó la orden de relevo médico/operativo para el operador Carlos Méndez (HT-104). Cumple con el protocolo de no-punición bajo la norma ISO 45001.`,
        timestamp: timeNow,
        badge: 'HSE & BIENESTAR',
      };
    }

    // 6. Ethics & Data Privacy
    if (q.includes('ética') || q.includes('etica') || q.includes('privacidad') || q.includes('consentimiento') || q.includes('anonim')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🛡️ **Gobernanza Ética y Privacidad de Datos:**\n\n- **Consentimiento Informado:** 100% de los operadores cuentan con firma digital activa.\n- **Anonimización Criptográfica:** Los nombres y cédulas se ofuscan en tiempo real mediante hashes SHA-256 (\`EMP-ANON-***\`) para analistas externos y auditores.\n- **Principio de No-Punición:** La telemetría de fatiga está orientada exclusivamente a la prevención de accidentes, no a sanciones disciplinarias.`,
        timestamp: timeNow,
        badge: 'ÉTICA & PRIVACIDAD',
      };
    }

    // Default Fallback
    return {
      id: `bot-${Date.now()}`,
      sender: 'ai',
      text: `Comprendo tu consulta: *"Estas analizando ${query}"*.\n\nEn este momento la flota de **${equipments.length} equipos** opera en clima **${weatherCondition}**. El Gemelo Digital mantiene streaming continuo a 1 Hz con **${alerts.filter(a => a.status === 'ACTIVE').length} alertas activas**.\n\n¿Deseas que analice un equipo en particular, exporte un reporte o revise la explicabilidad SHAP?`,
      timestamp: timeNow,
      badge: 'MINE ASSISTANT',
      actions: [
        { label: 'Analizar HT-104', actionId: 'check_critical', type: 'warning' },
        { label: 'Explicar Hipótesis H1', actionId: 'explain_h1', type: 'scenario' },
      ],
    };
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          id="btn-open-copilot"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center gap-2.5 transition-all transform hover:scale-105 group border border-amber-300/40 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -top-1 -right-1" />
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <p className="text-xs font-black tracking-tight leading-none">MineSafe AI</p>
            <p className="text-[10px] font-bold text-slate-900/80 leading-tight">Copiloto HSE & XAI</p>
          </div>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-2xl border shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
            isExpanded
              ? 'w-[95vw] sm:w-[650px] h-[85vh]'
              : 'w-[92vw] sm:w-[440px] h-[560px]'
          } ${
            isDark
              ? 'bg-slate-950/95 border-slate-800 text-slate-100 backdrop-blur-xl'
              : 'bg-white/95 border-slate-300 text-slate-900 backdrop-blur-xl'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">MineSafe AI Copilot</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    VIVO (1 Hz)
                  </span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Asistente de Gemelo Digital & Seguridad Minera
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages(initialMessages)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Limpiar chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips Bar */}
          <div className={`px-3 py-2 border-b overflow-x-auto scrollbar-none flex items-center gap-1.5 ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 whitespace-nowrap pl-1">
              <Sparkles className="w-3 h-3" /> Sugerencias:
            </span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className={`text-[10.5px] px-2.5 py-1 rounded-full whitespace-nowrap border transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-400'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-amber-500 hover:text-amber-600'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender badge & time */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {msg.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      {msg.badge}
                    </span>
                  )}
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md'
                      : msg.sender === 'system'
                      ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                      : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                      : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Interactive Action Buttons inside Message */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act.actionId)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                            act.type === 'warning'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                              : act.type === 'relief'
                              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                              : isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                              : 'bg-white hover:bg-slate-200 text-amber-700 border-slate-300'
                          }`}
                        >
                          <span>{act.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="animate-pulse">MineSafe AI procesando telemetría y SHAP...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
            }`}
          >
            <input
              type="text"
              placeholder="Pregunta a la IA sobre riesgos, fatiga, SHAP o emite comandos..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`flex-1 text-xs rounded-xl px-3.5 py-2.5 outline-none border transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-amber-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            />

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
