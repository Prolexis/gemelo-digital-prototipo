import React, { useState } from 'react';
import { UserRole } from '../../types/mining';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle, 
  UserCheck, 
  Shield, 
  Activity, 
  Cpu, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarInitials: string;
  badgeColor: string;
  department: string;
  accessLevel: string;
}

export const PRECONFIGURED_USERS: Record<UserRole, AppUser> = {
  SAFETY_SUPERVISOR: {
    id: 'usr-hse-01',
    name: 'Ing. Carlos Mendoza',
    email: 'supervisor.hse@mineraesperanza.cl',
    role: 'SAFETY_SUPERVISOR',
    roleLabel: 'Supervisor HSE',
    avatarInitials: 'CM',
    badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
    department: 'Superintendencia de Seguridad y Salud Ocupacional',
    accessLevel: 'Nivel 4 • Control de Alertas y Despacho',
  },
  ADMIN: {
    id: 'usr-adm-01',
    name: 'Alexis Sánchez (Admin)',
    email: 'admin.sistemas@mineraesperanza.cl',
    role: 'ADMIN',
    roleLabel: 'Administrador del Sistema',
    avatarInitials: 'AS',
    badgeColor: 'bg-rose-500/20 text-rose-500 border-rose-500/40',
    department: 'Gerencia de Tecnología & Gemelos Digitales',
    accessLevel: 'Nivel 5 • Acceso Total / Root',
  },
  OPERATOR: {
    id: 'usr-op-104',
    name: 'Marcos Riquelme',
    email: 'operador.ht104@mineraesperanza.cl',
    role: 'OPERATOR',
    roleLabel: 'Operador Camión CAT 797F',
    avatarInitials: 'MR',
    badgeColor: 'bg-sky-500/20 text-sky-500 border-sky-500/40',
    department: 'Mina Rajo - Turno Noche (Rampa Este)',
    accessLevel: 'Nivel 1 • Vista de Cabina & Telemetría',
  },
  DATA_ANALYST: {
    id: 'usr-da-02',
    name: 'Dra. Valentina Castro',
    email: 'data.scientist@mineraesperanza.cl',
    role: 'DATA_ANALYST',
    roleLabel: 'Data Scientist / Analista XAI',
    avatarInitials: 'VC',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    department: 'Modelado Predictivo & Algoritmos TreeSHAP',
    accessLevel: 'Nivel 3 • Inyección OOD & Calibración',
  },
  AUDITOR: {
    id: 'usr-aud-05',
    name: 'Dr. Arthur Pendelton',
    email: 'auditor.msha@sernageomin.gob.cl',
    role: 'AUDITOR',
    roleLabel: 'Auditor Externo MSHA / Sernageomin',
    avatarInitials: 'AP',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    department: 'Fiscalización de Seguridad Minera e ISO 21815',
    accessLevel: 'Nivel 2 • Auditoría & Solo Lectura Certificada',
  },
};

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [selectedRole, setSelectedRole] = useState<UserRole>('SAFETY_SUPERVISOR');
  const [email, setEmail] = useState<string>(PRECONFIGURED_USERS.SAFETY_SUPERVISOR.email);
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Manejador de selección de perfil preconfigurado
  const handleSelectDemoProfile = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(PRECONFIGURED_USERS[role].email);
    setPassword('MineSafe2026!#');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(PRECONFIGURED_USERS[selectedRole]);
    }, 600);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Navbar Minimalista */}
      <header className={`h-14 border-b px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
            MS
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <span>MineSafe 3D</span>
              <span className="text-[10px] text-amber-500 font-mono font-normal">• PORTAL DE AUTENTICACIÓN</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border hidden sm:flex items-center gap-1.5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ISO 27001 / SOC2 Compliant
          </span>

          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title="Alternar Modo Oscuro / Claro"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Columna Izquierda: Formulario de Login */}
          <div className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-2xl flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800 shadow-slate-950/60' : 'bg-white border-slate-200 shadow-slate-200/60'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Control de Acceso (RBAC)
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tajo 3200 • Minera Esperanza
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Iniciar Sesión en el Gemelo Digital
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingrese sus credenciales corporativas o seleccione un perfil preconfigurado para validar permisos y políticas de seguridad operacional.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Campo Correo */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Correo Corporativo
                  </label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 focus-within:border-amber-500' : 'bg-slate-50 border-slate-300 focus-within:border-amber-500'
                  }`}>
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="usuario@mineraesperanza.cl"
                      className="w-full bg-transparent text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Contraseña
                    </label>
                    <span className="text-[10px] text-amber-500 font-mono hover:underline cursor-pointer">
                      ¿Olvidó su clave?
                    </span>
                  </div>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 focus-within:border-amber-500' : 'bg-slate-50 border-slate-300 focus-within:border-amber-500'
                  }`}>
                    <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-transparent text-xs font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Perfil Seleccionado Info Card */}
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500 text-xs">
                      {PRECONFIGURED_USERS[selectedRole].avatarInitials}
                    </div>
                    <div>
                      <p className="font-bold leading-tight">{PRECONFIGURED_USERS[selectedRole].name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {PRECONFIGURED_USERS[selectedRole].roleLabel}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${PRECONFIGURED_USERS[selectedRole].badgeColor}`}>
                    {selectedRole}
                  </span>
                </div>

                {/* Botón de Enviar */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando en el Gemelo Digital...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar al Sistema con Rol {selectedRole}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className={`pt-4 mt-4 border-t text-[10px] flex items-center justify-between ${
              isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>
              <span>Token JWT firmado con clave RSA 2048</span>
              <span className="font-mono text-emerald-500">FastAPI TLS 1.3</span>
            </div>
          </div>

          {/* Columna Derecha: Selector de Roles Preconfigurados (Para presentación y demo) */}
          <div className={`lg:col-span-5 rounded-3xl border p-6 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800/80 backdrop-blur-xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">
                  Acceso Rápido por Perfil (Demo)
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Haga clic en cualquiera de los 5 roles normados para ingresar instantáneamente con sus credenciales y permisos:
              </p>

              {/* Lista de Perfiles */}
              <div className="mt-4 space-y-2">
                {(Object.keys(PRECONFIGURED_USERS) as UserRole[]).map((roleKey) => {
                  const user = PRECONFIGURED_USERS[roleKey];
                  const isSelected = selectedRole === roleKey;

                  return (
                    <button
                      key={roleKey}
                      id={`btn-demo-login-${roleKey}`}
                      type="button"
                      onClick={() => handleSelectDemoProfile(roleKey)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50'
                            : 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500/50'
                          : isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {user.roleLabel}
                          </p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${user.badgeColor}`}>
                          {roleKey}
                        </span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso de Auditoría */}
            <div className={`mt-5 p-3 rounded-xl border text-[11px] leading-relaxed ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditoría de Acceso Activa</span>
              </div>
              <span>
                Cada inicio de sesión genera un sello criptográfico inmutable en el registro de auditoría (*Audit Log*) para trazabilidad de la norma ISO 27001 y MSHA.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className={`border-t px-6 py-2.5 text-[11px] text-center ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <span>MineSafe 3D • Sistema de Gemelo Digital e Inteligencia Artificial Explicable (XAI)</span>
      </footer>
    </div>
  );
};
