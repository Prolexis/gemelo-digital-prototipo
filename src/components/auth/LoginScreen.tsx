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
  Sun, 
  Moon
} from 'lucide-react';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarInitials: string;
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
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      {/* Top Navbar Minimalista */}
      <header className="h-14 border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between bg-[var(--bg-elev)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] font-bold flex items-center justify-center text-sm">
            MS
          </div>
          <h1 className="text-sm font-semibold tracking-tight">MineSafe 3D</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="ms-badge-neutral text-[10px] px-2.5 py-1 rounded-full hidden sm:inline-flex">ISO 27001 · SOC 2</span>

          <button
            onClick={onToggleTheme}
            className="ms-button-neutral p-2 rounded-lg cursor-pointer"
            title="Alternar Modo Oscuro / Claro"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8 my-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-8 lg:gap-10 items-center">
          
          {/* Columna Izquierda: Formulario de Login */}
          <section className="w-full max-w-lg mx-auto" aria-labelledby="login-title">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Acceso corporativo · Tajo 3200</p>
              <h2 id="login-title" className="text-2xl font-semibold tracking-tight">
                Iniciar sesión
              </h2>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {/* Campo Correo */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Correo
                  </label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border transition-colors focus-within:border-[var(--accent)] ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                  }`}>
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="usuario@mineraesperanza.cl"
                      className="w-full bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Contraseña
                    </label>
                  </div>
                  <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border transition-colors focus-within:border-[var(--accent)] ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                  }`}>
                    <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-transparent text-sm font-medium outline-none"
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

                {/* Botón de Enviar */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="ms-button-primary w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando…</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </section>

          {/* Columna Derecha: Selector de Roles Preconfigurados (Para presentación y demo) */}
          <section className="lg:border-l lg:border-[var(--border)] lg:pl-8 pt-7 lg:pt-0 border-t lg:border-t-0" aria-labelledby="quick-access-title">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 id="quick-access-title" className="text-sm font-semibold">Acceso rápido</h3>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Perfiles de demostración</span>
                </div>

              {/* Lista de Perfiles */}
              <div className="mt-4 space-y-1.5">
                {(Object.keys(PRECONFIGURED_USERS) as UserRole[]).map((roleKey) => {
                  const user = PRECONFIGURED_USERS[roleKey];
                  const isSelected = selectedRole === roleKey;

                  return (
                    <button
                      key={roleKey}
                      id={`btn-demo-login-${roleKey}`}
                      type="button"
                      onClick={() => handleSelectDemoProfile(roleKey)}
                      aria-pressed={isSelected}
                      className="ms-button-neutral w-full min-w-0 p-2.5 rounded-lg text-left flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-md border flex items-center justify-center font-semibold text-[11px] flex-shrink-0 ${
                          isSelected
                            ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent)]'
                            : 'bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-soft)]'
                        }`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-medium truncate text-[var(--text)]">
                            {user.roleLabel}
                          </p>
                          <p className="text-[10px] truncate text-[var(--text-tertiary)]">
                            {user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isSelected && <CheckCircle className="w-4 h-4 text-[var(--accent)]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso de Auditoría */}
            <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-soft)]">
              <ShieldCheck className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span>Auditoría de acceso activa · ISO 27001 / MSHA</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[var(--border)] px-6 py-2.5 text-[11px] text-center text-[var(--text-tertiary)]">
        <span>MineSafe 3D · Minera Esperanza</span>
      </footer>
    </div>
  );
};
