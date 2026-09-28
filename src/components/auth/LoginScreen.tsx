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
      <header className="h-12 border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between bg-[var(--surface)] sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-control bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--accent-text)] font-semibold flex items-center justify-center text-xs">
            MS
          </div>
          <h1 className="text-xs font-semibold tracking-tight text-[var(--text)]">MineSafe 3D</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="ms-badge-neutral text-[10px] hidden sm:inline-flex">ISO 27001 · SOC 2</span>

          <button
            onClick={onToggleTheme}
            className="ms-button-ghost p-1.5 rounded-control cursor-pointer"
            title="Alternar Modo Oscuro / Claro"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] gap-6 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Formulario de Login */}
          <section className="w-full max-w-md mx-auto" aria-labelledby="login-title">
            <div className="ms-card">
              <p className="text-[11px] text-[var(--text-faint)] mb-1">Acceso corporativo · Tajo 3200</p>
              <h2 id="login-title" className="text-xl font-semibold tracking-tight text-[var(--text)]">
                Iniciar sesión
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                {/* Campo Correo */}
                <div className="space-y-1">
                  <label className="text-xs font-medium block text-[var(--text-muted)]">
                    Correo corporativo
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-control border border-[var(--border-strong)] bg-[var(--surface)] transition-colors focus-within:border-[var(--accent)]">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="usuario@mineraesperanza.cl"
                      className="w-full bg-transparent text-xs outline-none text-[var(--text)] placeholder:text-[var(--text-faint)]"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1">
                  <label className="text-xs font-medium block text-[var(--text-muted)]">
                    Contraseña
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-control border border-[var(--border-strong)] bg-[var(--surface)] transition-colors focus-within:border-[var(--accent)]">
                    <Lock className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-transparent text-xs outline-none text-[var(--text)] placeholder:text-[var(--text-faint)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Enviar (Único primario) */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="ms-button-primary w-full py-2.5 rounded-control font-medium text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[var(--accent-foreground)] border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando…</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Columna Derecha: Selector de Roles Preconfigurados */}
          <section className="lg:border-l lg:border-[var(--border)] lg:pl-6 pt-4 lg:pt-0" aria-labelledby="quick-access-title">
            <div className="ms-card">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 id="quick-access-title" className="text-xs font-semibold text-[var(--text)]">Acceso rápido</h3>
                <span className="text-[10px] text-[var(--text-faint)]">Perfiles de demostración</span>
              </div>

              {/* Lista de Perfiles */}
              <div className="space-y-1.5">
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
                      className={`w-full min-w-0 p-2 rounded-control text-left flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-control border flex items-center justify-center font-medium text-[10px] flex-shrink-0 ${
                          isSelected
                            ? 'bg-[var(--surface)] border-[var(--accent-border)] text-[var(--accent)]'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
                        }`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-medium truncate text-[var(--text)]">
                            {user.roleLabel}
                          </p>
                          <p className="text-[10px] truncate text-[var(--text-faint)]">
                            {user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Aviso de Auditoría */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" />
                <span>Auditoría activa · ISO 27001 / MSHA</span>
              </div>
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
