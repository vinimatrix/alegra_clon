import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Database,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  Info
} from 'lucide-react';
import { supabase, getSupabaseConfig } from '../services/supabaseClient';

interface SupabaseAuthGateProps {
  onLoginSuccess: (user: any) => void;
  isBackendActive: boolean;
  onBypassOffline: () => void;
}

export default function SupabaseAuthGate({ 
  onLoginSuccess, 
  isBackendActive,
  onBypassOffline 
}: SupabaseAuthGateProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const config = getSupabaseConfig();

  // Reset messages when switching tabs
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor complete todos los campos obligatorios.');
      return;
    }
    if (isSignUp && !fullName) {
      setErrorMessage('Por favor ingrese su nombre completo.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'admin'
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // If email confirmation is required, inform the user
          if (data.session) {
            setSuccessMessage('¡Cuenta creada y sesión iniciada con éxito!');
            setTimeout(() => {
              onLoginSuccess(data.user);
            }, 1500);
          } else {
            setSuccessMessage('¡Registro completado! Por favor verifique su correo electrónico para confirmar su cuenta.');
          }
        }
      } else {
        // Sign In with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMessage('¡Sesión iniciada correctamente! Cargando panel...');
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Error de autenticación Supabase:', err);
      // Give translate friendly feedback
      let friendlyError = err.message || 'Ocurrió un error inesperado.';
      if (
        friendlyError.includes('apiKey') || 
        friendlyError.toLowerCase().includes('api key') || 
        friendlyError.toLowerCase().includes('apikey')
      ) {
        friendlyError = 'Error de Configuración: La clave pública (Anon Key) de Supabase en las variables de entorno es incorrecta o inválida. Asegúrate de copiarla tal como está en el panel de Supabase.';
      } else if (friendlyError.includes('Invalid login credentials')) {
        friendlyError = 'Credenciales inválidas. Compruebe su correo o contraseña.';
      } else if (friendlyError.includes('User already registered')) {
        friendlyError = 'Este correo electrónico ya está registrado.';
      } else if (friendlyError.includes('Password should be')) {
        friendlyError = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (friendlyError.includes('Email not confirmed')) {
        friendlyError = 'Debe confirmar su correo electrónico antes de iniciar sesión.';
      }
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" id="auth-gate-container">
      {/* Dynamic Ambient Glow Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-xl shadow-black/80 overflow-hidden z-10"
        id="auth-card"
      >
        <div className="p-8 border-b border-slate-800 text-center relative">
          <div className="mx-auto w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white leading-tight">
            Alegra WebAdmin ERP
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 uppercase font-mono tracking-wider flex items-center justify-center gap-1.5">
            <LockKeyhole size={12} className="text-indigo-400" />
            Acceso Autorizado por Supabase Auth
          </p>
        </div>

        <div className="p-8">
          {/* Supabase Status Tag */}
          <div className="mb-6 p-3 rounded-lg flex items-center justify-between text-xs border bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${isBackendActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div>
                <p className="font-semibold text-white">Base de Datos Supabase</p>
                <p className="text-[10px] text-slate-400 font-mono text-left truncate max-w-[180px]">
                  {config.url !== 'https://placeholder.supabase.co' ? config.url : 'No configurado'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
              isBackendActive 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isBackendActive ? 'ACTIVO' : 'LOCAL DEMO'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isBackendActive ? (
              <motion.div
                key="active-auth-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Form Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800" id="auth-tabs">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                      !isSignUp 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                      isSignUp 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Registrarse
                  </button>
                </div>

                {/* Error & Success Messages */}
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <p className="leading-relaxed">{successMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-1">
                      <label htmlFor="reg-fullname" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <input
                          id="reg-fullname"
                          type="text"
                          required
                          placeholder="Juan Pérez"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-slate-900/60 transition-all font-sans"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="auth-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        placeholder="ejemplo@alegra.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-slate-900/60 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="auth-password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Contraseña
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-slate-900/60 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></span>
                        Procesando...
                      </span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="offline-bypass-alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-center"
              >
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left">
                  <div className="flex gap-2 text-amber-400 mb-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-bold text-xs uppercase">Supabase Desconectado</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No has configurado un proyecto activo de Supabase en los Ajustes del sistema. Puedes vincular tu base de datos y activar el autenticador ingresando tus credenciales anon en la pestaña de Configuración.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onBypassOffline}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <span>Continuar en Modo Demo Local</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative subtitle */}
      <span className="text-[10px] text-slate-600 mt-6 uppercase tracking-wider font-mono">
        © 2026 alegra clon erp • Dominican Republic
      </span>
    </div>
  );
}
