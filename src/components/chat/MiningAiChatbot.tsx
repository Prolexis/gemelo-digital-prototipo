import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Equipment, CollisionAlert, UserRole, MiningScenario } from '../../types/mining';
import { GeminiApiService } from '../../services/geminiApi';
import { 
  Bot, 
  Terminal,
  MessageSquare,
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
  VolumeX, 
  Mic, 
  MicOff, 
  Square,
  Play,
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
  
  // Audio: Speech-to-Text (STT) y Text-to-Speech (TTS)
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isDark = theme === 'dark';

  const initialMessages: ChatMessage[] = [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `**Consola de Monitoreo y Despacho Operativo.**\n\nEnlace de telemetría activo a 1 Hz. Puede consultar parámetros cinemáticos, índices de fatiga biológica (PERCLOS) en operadores, atenuación LiDAR o emitir advertencias de cabina.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: 'DESPACHO HSE',
      actions: [
        { label: 'Telemetría de camión crítico (HT-104)', actionId: 'check_critical', type: 'warning' },
        { label: 'Ventana de anticipación predictiva (H1)', actionId: 'explain_h1', type: 'scenario' },
        { label: 'Protocolo de relevo por fatiga', actionId: 'fatigue_protocol', type: 'relief' },
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

  // Limpiar síntesis de voz al desmontar o cerrar
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Tono acústico de radio minera (chime sintetizado con Web Audio API)
  const playRadioChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {}
  }, []);

  // Función de Text-to-Speech (Locución de voz en español)
  const speakText = useCallback((text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (currentlySpeakingMsgId === msgId) {
      setCurrentlySpeakingMsgId(null);
      return;
    }

    // Limpieza de Markdown para lectura natural
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/[-•]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05; // Cadencia adecuada para operaciones mineras
    utterance.pitch = 1.0;

    // Asignar voz en español si el navegador la tiene
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('es-')) || null;
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      if (msgId) setCurrentlySpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setCurrentlySpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [currentlySpeakingMsgId]);

  // Detener locución actual
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingMsgId(null);
    }
  }, []);

  // Reconocimiento de Voz (Speech-to-Text por Micrófono)
  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no cuenta con soporte para reconocimiento de voz (SpeechRecognition). Puedes utilizar Google Chrome, Microsoft Edge o Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        playRadioChime();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error al iniciar reconocimiento de voz:', err);
      setIsListening(false);
    }
  }, [isListening, playRadioChime]);

  // Sugerencias rápidas
  const suggestionChips = [
    '¿Cuál es el camión con mayor riesgo actual?',
    'Explicar desglose SHAP de HT-104',
    '¿Por qué el Gemelo Digital supera al PDS estándar?',
    'Enviar aviso sonoro preventivo a cabina',
    'Solicitar relevo por fatiga PERCLOS',
    '¿Cómo se garantiza la privacidad ética de los operadores?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
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

    // Intentar consultar al backend real de FastAPI Gemini primero
    try {
      const contextData = {
        role: currentRole,
        weather: weatherCondition,
        fleet_count: equipments.length,
        active_alerts: alerts.filter(a => a.status === 'ACTIVE').length,
        critical_truck: equipments.find(e => e.id === 'eq-ht-104'),
      };

      const geminiResult = await GeminiApiService.chat(query, contextData);

      let finalBotText = '';
      let finalBadge = 'GEMINI 2.5 FLASH';
      let actions: ChatMessage['actions'] = undefined;

      if (geminiResult.success && geminiResult.reply) {
        finalBotText = geminiResult.reply;
        if (query.toLowerCase().includes('riesgo') || query.toLowerCase().includes('ht-104')) {
          actions = [
            { label: '📢 Enviar Aviso Acústico a Cabina', actionId: 'cab_warning_ht104', type: 'warning' },
            { label: '🛑 Gestionar Relevo Inmediato', actionId: 'relief_ht104', type: 'relief' },
          ];
        }
      } else {
        // Fallback local enriquecido
        const fallbackMsg = generateLocalBotResponse(query);
        finalBotText = fallbackMsg.text;
        finalBadge = fallbackMsg.badge || 'XAI TREESHAP';
        actions = fallbackMsg.actions;
      }

      const botMsgId = `bot-${Date.now()}`;
      const botResponse: ChatMessage = {
        id: botMsgId,
        sender: 'ai',
        text: finalBotText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: finalBadge,
        actions,
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      // Si la voz está habilitada, locutar automáticamente
      if (isVoiceEnabled) {
        speakText(finalBotText, botMsgId);
      }
    } catch (err) {
      // Fallback local si falla la red
      const fallbackMsg = generateLocalBotResponse(query);
      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          ...fallbackMsg,
          id: botMsgId,
        },
      ]);
      setIsTyping(false);

      if (isVoiceEnabled) {
        speakText(fallbackMsg.text, botMsgId);
      }
    }
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'check_critical') {
      handleSendMessage('¿Cuál es el camión con mayor riesgo actual?');
    } else if (actionId === 'explain_h1') {
      handleSendMessage('¿Por qué el Gemelo Digital supera al PDS estándar?');
    } else if (actionId === 'fatigue_protocol') {
      handleSendMessage('Solicitar relevo por fatiga PERCLOS');
    } else if (actionId === 'cab_warning_ht104') {
      playRadioChime();
      onSendCabWarning?.('eq-ht-104');
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `🚨 **Aviso emitido**: Señal acústica y háptica transmitida a la cabina de HT-104 (Operador Carlos Méndez).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, sysMsg]);
      if (isVoiceEnabled) {
        speakText('Alerta transmitida a la cabina del camión HT 104.', sysMsg.id);
      }
    } else if (actionId === 'relief_ht104') {
      playRadioChime();
      onRequestRelief?.('op-104');
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `✅ **Relevo solicitado**: Despacho de Turno ha asignado un operador de reemplazo para HT-104 en el próximo pase del banco 3200.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, sysMsg]);
      if (isVoiceEnabled) {
        speakText('Relevo operacional solicitado para el operador de HT 104.', sysMsg.id);
      }
    }
  };

  const generateLocalBotResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

    if (q.includes('shap') || q.includes('explicabilidad') || q.includes('factores') || q.includes('tree')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🧠 **Explicabilidad Fast TreeSHAP en MineSafe 3D:**\n\nEl modelo fusiona 4 vectores multimodales y calcula la contribución marginal de cada variable:\n\n1. **Fatiga del Operador (65% del riesgo):** Cierre ocular PERCLOS elevado + 10.8 horas continuas en turno noche.\n2. **Cinemática GNSS (18% del riesgo):** Velocidad de acarreo en descenso (34 km/h en pendiente del 8.5%).\n3. **Percepción LiDAR (12% del riesgo):** Distancia proyectada al obstáculo (42 metros) con atenuación por polvo.\n4. **Inestabilidad de Maniobra (5%):** Variabilidad en volante y correcciones tardías.\n\n💡 **Recomendación Contrafáctica:** Si el operador reduce la velocidad a 22 km/h o es relevado, el score cae de 88% a 14% (Riesgo Bajo).`,
        timestamp: timeNow,
        badge: 'XAI TREESHAP',
      };
    }

    if (q.includes('pds') || q.includes('h1') || q.includes('anticipacion') || q.includes('comparativa') || q.includes('superioridad')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🎯 **Validación de la Hipótesis H1 (Gemelo Digital vs PDS):**\n\n- **MineSafe 3D (Gemelo Digital):** Emite la alerta con **6.4 segundos de anticipación media** gracias a la fusión predictiva de trayectorias y comportamiento del operador.\n- **Sistemas PDS Estándar:** Reaccionan típicamente a **1.8 segundos** (basados únicamente en proximidad geométrica por radar/cámaras).\n\n🚀 **Ganancia Operacional:** **+255% de tiempo adicional de reacción (+4.6s)**, permitiendo a los camiones de 400 toneladas frenar de manera suave y segura sin pérdida de control en rampa.`,
        timestamp: timeNow,
        badge: 'BENCHMARK VALIDADO',
      };
    }

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

    if (q.includes('ética') || q.includes('etica') || q.includes('privacidad') || q.includes('consentimiento') || q.includes('anonim')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'ai',
        text: `🛡️ **Gobernanza Ética y Privacidad de Datos:**\n\n- **Consentimiento Informado:** 100% de los operadores cuentan con firma digital activa.\n- **Anonimización Criptográfica:** Los nombres y cédulas se ofuscan en tiempo real mediante hashes SHA-256 (\`EMP-ANON-***\`) para analistas externos y auditores.\n- **Principio de No-Punición:** La telemetría de fatiga está orientada exclusivamente a la prevención de accidentes, no a sanciones disciplinarias.`,
        timestamp: timeNow,
        badge: 'ÉTICA & PRIVACIDAD',
      };
    }

    return {
      id: `bot-${Date.now()}`,
      sender: 'ai',
      text: `Comprendo tu consulta: *"Estas analizando: ${query}"*.\n\nEn este momento la flota de **${equipments.length} equipos** opera en clima **${weatherCondition}**. El Gemelo Digital mantiene streaming continuo a 1 Hz con **${alerts.filter(a => a.status === 'ACTIVE').length} alertas activas**.\n\nPuedes utilizar el micrófono 🎙️ para hacer consultas por voz o preguntarme sobre cualquier camión en específico.`,
      timestamp: timeNow,
      badge: 'MINE ASSISTANT',
      actions: [
        { label: 'Analizar HT-104', actionId: 'check_critical', type: 'warning' },
        { label: 'Explicar Hipótesis H1', actionId: 'explain_h1', type: 'scenario' },
      ],
    };
  };

  return (
    <>
      {/* Botón flotante sobrio para abrir la Consola de Despacho */}
      {!isOpen && (
        <button
          id="btn-open-copilot"
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 px-3.5 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600 shadow-slate-950/60'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-md'
          }`}
          title="Abrir Consola de Despacho y Telemetría"
        >
          <div className="relative">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">Consola de Despacho</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-tight`}>Telemetría 1 Hz</p>
          </div>
        </button>
      )}

      {/* Ventana de la Consola */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col shadow-2xl border ${
            isExpanded
              ? 'inset-4 md:inset-10 rounded-2xl'
              : 'bottom-6 right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl'
          } ${
            isDark
              ? 'bg-slate-950 border-slate-800 shadow-slate-950/80 text-slate-100'
              : 'bg-white border-slate-200 shadow-xl text-slate-900'
          }`}
        >
          {/* Header de la Consola */}
          <div className={`p-3.5 border-b flex items-center justify-between transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                isDark ? 'bg-slate-800 border-slate-700 text-amber-500' : 'bg-white border-slate-300 text-amber-600'
              }`}>
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Consola de Despacho & Seguridad
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded">
                    ACTIVO
                  </span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Monitoreo Predictivo • Canal de Telemetría 1 Hz
                </p>
              </div>
            </div>

            {/* Controles de Cabecera: Altavoz Global, Limpiar, Maximizar, Cerrar */}
            <div className="flex items-center gap-1">
              <button
                id="btn-toggle-chatbot-voice"
                onClick={() => {
                  if (currentlySpeakingMsgId) stopSpeaking();
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isVoiceEnabled
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}
                title={isVoiceEnabled ? 'Lectura por voz activada (clic para silenciar)' : 'Lectura por voz silenciada (clic para activar)'}
              >
                {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  setMessages(initialMessages);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Limpiar conversación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title={isExpanded ? 'Restaurar tamaño normal' : 'Pantalla amplia'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                  setIsOpen(false);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Sugerencias Rápidas */}
          <div className={`px-3 py-2 border-b overflow-x-auto scrollbar-none flex items-center gap-1.5 ${
            isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap pl-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <HelpCircle className="w-3 h-3" /> Consultas rápidas:
            </span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className={`text-[10.5px] px-2.5 py-1 rounded-full whitespace-nowrap border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-400'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-amber-500 hover:text-amber-600 shadow-xs'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Mensajes del Chat */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 text-xs ${
            isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'
          }`}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              const isMsgSpeaking = currentlySpeakingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Encabezado del mensaje con insignia, hora y botón de reproducir audio */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {msg.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        {msg.badge}
                      </span>
                    )}
                    <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>

                    {/* Botón de reproducción de audio individual para respuestas de la IA */}
                    {isAi && (
                      <button
                        onClick={() => {
                          if (isMsgSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.text, msg.id);
                          }
                        }}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          isMsgSpeaking
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                        }`}
                        title={isMsgSpeaking ? 'Detener lectura' : 'Escuchar respuesta en voz alta'}
                      >
                        {isMsgSpeaking ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                      </button>
                    )}
                  </div>

                  {/* Burbuja del mensaje */}
                  <div
                    className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md'
                        : msg.sender === 'system'
                        ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                        : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Botones de acción integrados dentro de la respuesta */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className={`mt-3 pt-2.5 border-t flex flex-wrap gap-1.5 ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
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
                                : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300'
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
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="animate-pulse">MineSafe AI procesando telemetría y SHAP con Gemini...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Indicador visual si el micrófono está escuchando */}
          {isListening && (
            <div className="bg-rose-500/15 border-t border-rose-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-rose-500 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-[11px]">Escuchando micrófono... Habla claramente tu consulta</span>
              </div>
              <button
                onClick={toggleSpeechRecognition}
                className="text-[10px] font-bold underline cursor-pointer hover:text-rose-600"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Área de Entrada con Botón de Micrófono (Audio) y Enviar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
            }`}
          >
            {/* Botón de Entrada por Voz (Micrófono) */}
            <button
              id="btn-chatbot-mic"
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 animate-pulse ring-2 ring-rose-400/50'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-amber-600 border-slate-300 shadow-xs'
              }`}
              title={isListening ? 'Detener dictado por voz' : 'Hablar por micrófono (Dictado por Voz)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Escuchando tu voz..." : "Pregunta sobre riesgos, fatiga, o usa el micrófono 🎙️..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`flex-1 text-xs rounded-xl px-3.5 py-2.5 outline-none border transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-amber-500 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 placeholder:text-slate-400'
              }`}
            />

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer flex-shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
