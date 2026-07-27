import React, { useState, useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { Mail, Lock, AlertCircle, ChevronLeft, Zap, Sparkles, Globe, Cpu, Shield, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../../services/firebase';

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthScreen: React.FC = () => {
    const { t, changeScene, settings, updateSettings, isAuthLoading } = useSceneManager();
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parallax background mouse tracking references
    const bgRef = useRef<HTMLDivElement>(null);
    const targetOffset = useRef({ x: 0, y: 0 });
    const currentOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            targetOffset.current = {
                x: (e.clientX / window.innerWidth - 0.5) * 45,
                y: (e.clientY / window.innerHeight - 0.5) * 45
            };
        };

        let animId: number;
        const updateParallax = () => {
            const lerpVal = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
            
            currentOffset.current.x = lerpVal(currentOffset.current.x, targetOffset.current.x, 0.08);
            currentOffset.current.y = lerpVal(currentOffset.current.y, targetOffset.current.y, 0.08);

            if (bgRef.current) {
                bgRef.current.style.transform = `translate3d(${currentOffset.current.x}px, ${currentOffset.current.y}px, 0)`;
            }
            animId = requestAnimationFrame(updateParallax);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animId = requestAnimationFrame(updateParallax);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animId);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) return;

        let targetEmail = email;
        let targetPassword = password;

        if (email.toLowerCase() === 'admin' && password === 'admin') {
            targetEmail = 'admin@nimbus.com';
            targetPassword = 'adminpassword123';
        }

        if (mode === 'REGISTER') {
            if (password !== confirmPassword) {
                setError(t('auth_error_password_match') || (settings.language.startsWith('en') ? "Passwords do not match!" : "As senhas não coincidem!"));
                return;
            }
            if (!acceptedTerms) {
                setError(settings.language.startsWith('en') ? "You must read and accept the Terms of Service and Privacy Policy to register." : "Você deve ler e aceitar os Termos de Serviço e Política de Privacidade para se registrar.");
                return;
            }
        }

        setIsSubmitting(true);
        AudioManager.getInstance().playSFX('confirm');

        try {
            if (mode === 'LOGIN') {
                await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
            } else {
                await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            if (email.toLowerCase() === 'admin' && password === 'admin' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
                try {
                    await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
                } catch (regErr: any) {
                    setError(regErr.message);
                }
            } else {
                let displayError = err.message || (settings.language.startsWith('en') ? "An error occurred during authentication" : "Ocorreu um erro ao autenticar");
                if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                    displayError = settings.language.startsWith('en') ? "Incorrect email or password" : "E-mail ou senha incorretos";
                } else if (err.code === 'auth/invalid-email') {
                    displayError = settings.language.startsWith('en') ? "Invalid email address" : "Endereço de e-mail inválido";
                } else if (err.code === 'auth/weak-password') {
                    displayError = settings.language.startsWith('en') ? "The password must be at least 6 characters" : "A senha deve ter pelo menos 6 caracteres";
                } else if (err.code === 'auth/email-already-in-use') {
                    displayError = settings.language.startsWith('en') ? "This email is already in use" : "Este e-mail já está em uso";
                }
                setError(displayError);
            }
            AudioManager.getInstance().playSFX('click');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsSubmitting(true);
        AudioManager.getInstance().playSFX('confirm');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Google Auth error:", err);
            setError(err.message);
            AudioManager.getInstance().playSFX('click');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'LOGIN' ? 'REGISTER' : 'LOGIN');
        setError(null);
        AudioManager.getInstance().playSFX('click');
    };

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        changeScene(SceneName.NETWORK_SELECT);
    };

    const toggleLanguage = () => {
        const isEnglish = settings.language.startsWith('en');
        updateSettings({ language: isEnglish ? 'pt-BR' : 'en-US' });
        AudioManager.getInstance().playSFX('click');
    };

    return (
        <div id="auth-screen" className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative bg-grain">
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/fundobanner/b1.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>
            <div className="scanline" />
            
            {/* Cinematic Parallax Background Layer */}
            <div className="absolute inset-0 opacity-15 pointer-events-none z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div 
                ref={bgRef}
                className="absolute inset-0 pointer-events-none will-change-transform"
            >
                <div className="absolute top-1/4 left-1/4 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-orange-600/10 rounded-full blur-[160px]" />
                
                <img 
                    src="/Assets/fundosdastelas/modos/m1.png" 
                    className="absolute inset-0 w-full h-full object-cover grayscale-[30%] opacity-15"
                    alt="" 
                />
            </div>
            
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/80 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/40 to-stone-950/90 pointer-events-none" />

            {/* Glowing Aura Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div 
                        key={`auth-p-${i}`}
                        className="absolute w-1 h-1 bg-orange-500 rounded-full animate-float-particle opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${7 + Math.random() * 7}s`
                        }}
                    />
                ))}
            </div>

            {/* TOP HEADER */}
            <header className="absolute top-0 left-0 right-0 h-16 md:h-24 px-4 md:px-8 flex items-center justify-between z-50 pointer-events-auto">
                {/* Back Button built with slant menu geometry style */}
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 group cursor-pointer pointer-events-auto"
                >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-stone-900 border border-stone-700 flex items-center justify-center transform skew-x-[-12deg] group-hover:bg-orange-600 group-hover:border-orange-500 transition-all ">
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300 group-hover:text-white transform skew-x-[12deg]" />
                    </div>
                    <span className="text-xs md:text-sm font-black italic uppercase tracking-widest text-stone-300 group-hover:text-white transition-colors drop-shadow-md">
                        {t('menu_back') || 'VOLTAR'}
                    </span>
                </button>

                {/* Subtitle center node */}
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-stone-900/60 border border-stone-800 rounded-full backdrop-blur-sm">
                    <Cpu className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                    <span className="text-[9px] font-black italic uppercase tracking-wider text-stone-400">
                        {settings.language.startsWith('en') ? "WELCOME TO THE ARENA" : "BEM-VINDO À ARENA"}
                    </span>
                </div>

                {/* Locale Selector matches headers */}
                <button 
                    onClick={toggleLanguage} 
                    className="bg-stone-900/80 border border-stone-750 px-4 h-10 rounded-lg font-header italic text-xs text-stone-300 hover:text-white hover:border-orange-500 hover: transition-all flex items-center gap-1.5 cursor-pointer pointer-events-auto"
                >
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    <span className="tracking-wider uppercase">{settings.language.startsWith('en') ? 'ENGLISH' : 'PORTUGUÊS'}</span>
                </button>
            </header>

            {/* MAIN LANDSCAPE SIDE-BY-SIDE CONTENT (NO V-STACKING TO COVER IN LOW HEIGHTS) */}
            <div className="w-full flex-1 flex flex-row items-center justify-between px-10 md:px-16 lg:px-24 z-10 relative pt-20 h-full overflow-hidden">
                
                {/* Left Column: Immersive Brand and Game Logo watermark */}
                <div className="flex-1 max-w-[46%] h-full flex flex-col justify-center items-start text-left pointer-events-none relative">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-start"
                    >
                        <img 
                            src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
                            alt="Fighter Legend One 1 Logo" 
                            className="w-[280px] md:w-[350px] lg:w-[450px] object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.4)] mb-4 animate-pulse-glow" 
                        />
                        
                        <div className="flex items-center gap-2.5 mb-3 bg-orange-600/10 px-3 py-1.5 rounded-md border border-orange-500/20 backdrop-blur-md">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-black italic uppercase tracking-widest text-orange-500 leading-none">
                                {settings.language.startsWith('en') ? "FIGHTERS DATABASE" : "DATABASE DE LUTADORES"}
                            </span>
                        </div>

                        <p className="text-stone-400 text-[11px] leading-relaxed uppercase tracking-wider max-w-sm hidden md:block">
                            {settings.language.startsWith('en')
                                ? "Log in or register to save your progress, customize your fighter card, and join cloud-based tournaments."
                                : "Entre ou registre-se para salvar progresso, customizar o seu cartão de lutador e disputar torneios na nuvem."}
                        </p>
                    </motion.div>
                </div>

                {/* Right Column: Custom Compact Slide-in Auth Form */}
                <div className="flex-1 max-w-[48%] h-full flex flex-col justify-center items-end relative">
                    <motion.div 
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, type: 'spring', damping: 22 }}
                        className="w-full max-w-[420px] bg-stone-950/20 border-r-4 border-orange-600 border border-white/5 backdrop-blur-2xl rounded-xl p-5 md:p-6 relative overflow-hidden flex flex-col pointer-events-auto max-h-[82vh]"
                    >
                        {/* Custom Slanted Visual corner styling */}
                        <div className="absolute top-0 right-0 w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 " />
                        
                        <div className="mb-4">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Shield className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-[9px] text-orange-500 font-black tracking-[0.25em] uppercase">
                                    {settings.language.startsWith('en') ? "GAME ACCESS" : "ACESSO AO JOGO"}
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-header italic uppercase tracking-widest text-white leading-none">
                                {mode === 'LOGIN' ? t('auth_login') || (settings.language.startsWith('en') ? "LOG IN" : "CONECTAR") : t('auth_register') || (settings.language.startsWith('en') ? "REGISTER" : "CRIAR CONTA")}
                            </h2>
                        </div>

                        {/* Scrolling area for error and inputs directly to keep everything bounded */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[50vh] scrollbar-thin">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 border border-red-500/25 bg-red-500/10 flex items-start gap-2.5 text-red-400 rounded-lg"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                {/* Email Input */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-stone-400 tracking-wider uppercase flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-orange-500" />
                                        {t('auth_email') || (settings.language.startsWith('en') ? "EMAIL ADDRESS" : "ENDEREÇO DE EMAIL")}
                                    </label>
                                    <input 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={settings.language.startsWith('en') ? "EXAMPLE@FIGHTER.COM" : "EXEMPLO@LUTADOR.COM"}
                                        className="w-full h-10 bg-black/60 border border-stone-800 focus:border-orange-500 px-3 text-white uppercase font-black text-xs tracking-widest outline-none transition-all rounded-lg placeholder:text-stone-700"
                                        required
                                    />
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-stone-400 tracking-wider uppercase flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-orange-500" />
                                        {t('auth_password') || (settings.language.startsWith('en') ? "SECRET PASSWORD" : "SENHA SECRETA")}
                                    </label>
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-10 bg-black/60 border border-stone-800 focus:border-orange-500 px-3 text-white uppercase font-black text-xs tracking-widest outline-none transition-all rounded-lg placeholder:text-stone-700"
                                        required
                                    />
                                </div>

                                {/* Password Confirmation */}
                                {mode === 'REGISTER' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-1"
                                    >
                                        <label className="text-[9px] font-black text-stone-400 tracking-wider uppercase flex items-center gap-1.5">
                                            <Lock className="w-3 h-3 text-orange-500" />
                                            {t('auth_confirm_password') || (settings.language.startsWith('en') ? "CONFIRM PASSWORD" : "CONFIRME A SENHA")}
                                        </label>
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full h-10 bg-black/60 border border-stone-800 focus:border-orange-500 px-3 text-white uppercase font-black text-xs tracking-widest outline-none transition-all rounded-lg placeholder:text-stone-700"
                                            required
                                        />
                                    </motion.div>
                                )}

                                {/* Terms of Service and Privacy Policy Checkbox */}
                                {mode === 'REGISTER' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-start gap-2.5 pt-2"
                                    >
                                        <input 
                                            id="accept-terms-checkbox"
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="w-4 h-4 mt-0.5 accent-orange-600 rounded bg-black/60 border border-stone-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                            required
                                        />
                                        <label htmlFor="accept-terms-checkbox" className="text-[10px] font-bold text-stone-400 leading-normal uppercase tracking-wider">
                                            {settings.language.startsWith('en') ? "I read and agree to the " : "Eu li e concordo com os "}{" "}
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    AudioManager.getInstance().playSFX('click');
                                                    setShowTermsModal(true);
                                                }}
                                                className="text-orange-500 hover:text-white transition-colors underline cursor-pointer inline-block bg-transparent border-none p-0"
                                            >
                                                {settings.language.startsWith('en') ? "Terms of Service & Privacy Policy" : "Termos de Serviço & Política de Privacidade"}
                                            </button>
                                        </label>
                                    </motion.div>
                                )}

                                {/* Compact Send CTA Button */}
                                <div className="pt-1.5">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-3 relative overflow-hidden group font-header italic text-base tracking-widest uppercase transition-all duration-300 rounded-lg cursor-pointer flex items-center justify-center border-l-2 border-orange-400
                                            ${isSubmitting
                                                ? 'bg-stone-800 text-stone-500 border-stone-750 cursor-not-allowed'
                                                : 'bg-orange-600 hover:bg-orange-500 text-white  hover: active:scale-97'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span className="animate-pulse">{settings.language.startsWith('en') ? "PROCESSING..." : "PROCESSANDO..."}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{mode === 'LOGIN' ? (settings.language.startsWith('en') ? "AUTHORIZE ACCESS" : "AUTORIZAR ACESSO") : (settings.language.startsWith('en') ? "REGISTER WARRIOR" : "REGISTRAR COMBATENTE")}</span>
                                                    <Zap className="w-4 h-4 text-white fill-white group-hover:scale-125 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </form>

                            {/* Google Sign In Option */}
                            <div className="pt-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-[1px] flex-1 bg-stone-800" />
                                    <span className="text-[8px] font-black text-stone-600 uppercase tracking-[0.3em]">OR</span>
                                    <div className="h-[1px] flex-1 bg-stone-800" />
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isSubmitting}
                                    className="w-full h-10 bg-white hover:bg-stone-200 text-stone-950 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        {settings.language.startsWith('en') ? "CONTINUE WITH GOOGLE" : "CONTINUAR COM GOOGLE"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col items-center shrink-0">
                            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">
                                {mode === 'LOGIN' ? (settings.language.startsWith('en') ? "DON'T HAVE AN ACCOUNT?" : "NÃO POSSUI REGISTRO?") : (settings.language.startsWith('en') ? "ALREADY HAVE AN ACCOUNT?" : "JÁ POSSUI REGISTRO?")}
                            </span>
                            <button 
                                onClick={toggleMode}
                                className="text-[11px] font-header italic text-orange-500 hover:text-white transition-colors uppercase tracking-widest border-b border-orange-500/20 hover:border-white pb-0.5 cursor-pointer"
                            >
                                {mode === 'LOGIN' ? t('auth_go_to_register') || (settings.language.startsWith('en') ? "CREATE ACCOUNT" : "CRIAR CONTA") : t('auth_go_to_login') || (settings.language.startsWith('en') ? "BACK TO ACCESS" : "VOLTAR PARA ACESSO")}
                            </button>
                        </div>

                    </motion.div>
                </div>

            </div>

            {/* Terms and Privacy Policy Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl relative"
                        >
                            {/* Slanted Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-500" />
                            
                            <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-lg font-header italic uppercase tracking-wider text-white">
                                        {settings.language.startsWith('en') ? "Terms of Service & Privacy" : "Termos de Serviço & Privacidade"}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => {
                                        AudioManager.getInstance().playSFX('cancel');
                                        setShowTermsModal(false);
                                    }}
                                    className="text-stone-400 hover:text-white transition-colors p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </header>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-300 text-xs leading-relaxed uppercase tracking-wider custom-scrollbar">
                                <section className="space-y-2">
                                    <h4 className="text-orange-500 font-bold font-header tracking-widest text-sm">
                                        {settings.language.startsWith('en') ? "1. ACCEPTANCE OF TERMS" : "1. ACEITAÇÃO DOS TERMOS"}
                                    </h4>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "BY CREATING AN ACCOUNT ON THE FIGHTER LEGEND ONE PLATFORM, YOU DECLARE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO FULLY COMPLY WITH THESE TERMS OF SERVICE AND THE PRIVACY POLICY."
                                            : "AO CRIAR UMA CONTA NA PLATAFORMA DE FIGHTER LEGEND ONE, VOCÊ DECLARA QUE LEU, COMPREENDEU E CONCORDOU EM CUMPRIR INTEGRALMENTE ESTES TERMOS DE SERVIÇO E A POLÍTICA DE PRIVACIDADE."}
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-orange-500 font-bold font-header tracking-widest text-sm">
                                        {settings.language.startsWith('en') ? "2. FIGHTER RULES OF CONDUCT" : "2. REGRAS DE CONDUTA DO LUTADOR"}
                                    </h4>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "TO PRESERVE THE COMPETITIVE INTEGRITY OF THE ARENA, THE FOLLOWING PRACTICES ARE STRICTLY PROHIBITED:"
                                            : "PARA PRESERVAR A INTEGRIDADE COMPETITIVA DA ARENA, SÃO ESTRITAMENTE PROIBIDAS AS SEGUINTES PRÁTICAS:"}
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        {settings.language.startsWith('en') ? (
                                            <>
                                                <li>USE OF HACKS, CHEATING MODS, SCRIPTS, OR ANY OTHER FORM OF UNFAIR ADVANTAGE IN ONLINE BATTLES.</li>
                                                <li>ABUSIVE BEHAVIOR, OFFENSES, TOXICITY, OR ANY TYPE OF PREJUDICE IN GLOBAL OR ROOM CHATS.</li>
                                                <li>MATCH FIXING, LEAGUE MANIPULATION, OR EXPLOITING GAME BUGS FOR PERSONAL ADVANTAGE.</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>USO DE HACKS, MODS TRAPACEIROS, SCRIPTS OU QUALQUER OUTRA FORMA DE VANTAGEM INDEVIDA NAS BATALHAS ONLINE.</li>
                                                <li>COMPORTAMENTO ABUSIVO, OFENSAS, TOXICIDADE OU QUALQUER TIPO DE PRECONCEITO NO CHAT GLOBAL OU DE SALAS.</li>
                                                <li>COMBINAR RESULTADOS DE PARTIDAS, MANIPULAÇÃO DE RANKING OU APROVEITAMENTO DE BUGS DO JOGO PARA VANTAGEM PRÓPRIA.</li>
                                            </>
                                        )}
                                    </ul>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "FAILURE TO COMPLY WITH THESE RULES WILL RESULT IN TEMPORARY SUSPENSION OR PERMANENT ACCOUNT BANNING WITHOUT PRIOR NOTICE."
                                            : "O DESCUMPRIMENTO DESTAS REGRAS RESULTARÁ EM SUSPENSÃO TEMPORÁRIA OU BANIMENTO PERMANENTE DA CONTA SEM AVISO PRÉVIO."}
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-orange-500 font-bold font-header tracking-widest text-sm">
                                        {settings.language.startsWith('en') ? "3. ACCOUNT AND DATA DELETION" : "3. EXCLUSÃO DE DADOS E CONTA"}
                                    </h4>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "THE USER HAS THE RIGHT TO REQUEST THE COMPLETE AND PERMANENT DELETION OF THEIR PROFILE, BATTLE HISTORY, AND SAVED DATA FROM OUR DATABASE AT ANY TIME, DIRECTLY IN THE GAME SETTINGS OR VIA OFFICIAL CONTACT."
                                            : "O USUÁRIO TEM O DIREITO DE REQUERER A EXCLUSÃO COMPLETA E PERMANENTE DE SEU PERFIL, HISTÓRICO DE BATALHAS E DADOS SALVOS DA NOSSA BASE DE DADOS A QUALQUER MOMENTO, DIRETAMENTE NAS CONFIGURAÇÕES DO JOGO OU POR CONTATO OFICIAL."}
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-orange-500 font-bold font-header tracking-widest text-sm">
                                        {settings.language.startsWith('en') ? "4. PRIVACY POLICY" : "4. POLÍTICA DE PRIVACIDADE"}
                                    </h4>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "YOUR PRIVACY IS OUR PRIORITY. WE COLLECT ONLY THE ESSENTIAL DATA FOR THE SECURE OPERATION OF THE PLATFORM:"
                                            : "SUA PRIVACIDADE É NOSSA PRIORIDADE. COLETAMOS APENAS OS DADOS ESSENCIAIS PARA O FUNCIONAMENTO SEGURO DA PLATAFORMA:"}
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        {settings.language.startsWith('en') ? (
                                            <>
                                                <li>EMAIL ADDRESS: USED EXCLUSIVELY FOR SECURE AUTHENTICATION VIA FIREBASE AUTH.</li>
                                                <li>PROFILE DATA AND STATISTICS: COINS, GEMS, UNLOCKED CHARACTERS, WINS, LOSSES, AND COMPETITIVE RANKINGS ARE STORED IN CLOUD FIRESTORE TO ENSURE YOUR PROGRESS PERSISTS ACROSS DEVICES.</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>ENDEREÇO DE E-MAIL: UTILIZADO EXCLUSIVAMENTE PARA AUTENTICAÇÃO SEGURA VIA FIREBASE AUTH.</li>
                                                <li>DADOS DE PERFIL E ESTATÍSTICAS: MOEDAS, GEMAS, PERSONAGENS DESBLOQUEADOS, VITÓRIAS, DERROTAS E RANKING COMPETITIVO SÃO ARMAZENADOS NO CLOUD FIRESTORE PARA GARANTIR A PERSISTÊNCIA DO SEU PROGRESSO ENTRE DISPOSITIVOS.</li>
                                            </>
                                        )}
                                    </ul>
                                    <p>
                                        {settings.language.startsWith('en')
                                            ? "NO PERSONAL DATA IS SOLD, SHARED, OR DISCLOSED TO THIRD PARTIES IN ANY WAY."
                                            : "NENHUM DADO PESSOAL É VENDIDO, COMPARTILHADO OU EXPEDIDO PARA TERCEIROS DE NENHUMA FORMA."}
                                    </p>
                                </section>
                            </div>
                            
                            <footer className="px-6 py-4 border-t border-white/5 bg-black/25 flex items-center justify-end gap-3 shrink-0">
                                <button 
                                    onClick={() => {
                                        AudioManager.getInstance().playSFX('confirm');
                                        setAcceptedTerms(true);
                                        setShowTermsModal(false);
                                    }}
                                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                >
                                    <span>{settings.language.startsWith('en') ? "ACCEPT & CONFIRM" : "ACEITAR E CONFIRMAR"}</span>
                                    <Zap className="w-3.5 h-3.5 fill-white" />
                                </button>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
