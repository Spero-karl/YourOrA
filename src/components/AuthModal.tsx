/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  authenticateSecureAccount,
  registerSecureAccount,
  evaluatePasswordSecurity,
  requestPasswordReset,
  completePasswordReset,
  isDeliveryAccountPreRegistered,
  activatePreRegisteredDeliveryAccount
} from '../utils/securityAuth';
import {
  formatBeninNational,
  sanitizeBeninDigits,
  detectBeninOperator,
  BENIN_OPERATORS
} from '../utils/beninPhone';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, isAdminLogin?: boolean, isDeliveryLogin?: boolean) => void;
  onOpenDeliveryPortal?: () => void;
  reason?: 'checkout' | 'manual' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  reason
}) => {
  // Authentication mode: 'login' | 'register' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  // Login credential method: 'phone' | 'email'
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');

  // Form states - ZERO AUTOFILL / ALWAYS EMPTY ON START
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form states
  const [registerName, setRegisterName] = useState('');
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerCity, setRegisterCity] = useState('Cotonou');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot password flow states
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewPasswordConfirm, setResetNewPasswordConfirm] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [simulatedResetOtp, setSimulatedResetOtp] = useState<string | null>(null);
  const [maskedResetTarget, setMaskedResetTarget] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Delivery first-time activation states (registered by Admin, creating password)
  const [isDeliveryActivationOpen, setIsDeliveryActivationOpen] = useState(false);
  const [activationLogin, setActivationLogin] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationPasswordConfirm, setActivationPasswordConfirm] = useState('');
  const [showActivationPassword, setShowActivationPassword] = useState(false);

  // Feedback & Lockout countdown
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [accountNotFoundNotice, setAccountNotFoundNotice] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  // Reset errors when closing or opening
  useEffect(() => {
    if (!isOpen) {
      setErrorFeedback(null);
      setAccountNotFoundNotice(false);
      setSuccessFeedback(null);
      setIsSubmitting(false);
      setSimulatedResetOtp(null);
      setMaskedResetTarget(null);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining === null || lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  // Phone operator auto-detection
  const detectedLoginOp = detectBeninOperator(loginPhone);
  const detectedRegisterOp = detectBeninOperator(registerPhone);

  // Password security reports
  const passwordSecurity = evaluatePasswordSecurity(registerPassword);
  const passwordsMatch = registerPassword && registerPassword === registerPasswordConfirm;
  const resetPasswordSecurity = evaluatePasswordSecurity(resetNewPassword);

  // Helper: auto-uppercase AD- and LIVREUR- prefixes strictly (no lowercase permitted)
  const normalizeStrictPrefixes = (val: string): string => {
    if (/^ad-/i.test(val)) {
      return 'AD-' + val.slice(3);
    }
    if (/^livreur-/i.test(val)) {
      return 'LIVREUR-' + val.slice(8);
    }
    return val;
  };

  // Handle phone input formatting
  const handlePhoneChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const normalized = normalizeStrictPrefixes(val);
    if (normalized.startsWith('LIVREUR-') || normalized.startsWith('AD-')) {
      setter(normalized);
      return;
    }
    if (/^[0-9+\s]+$/.test(normalized) || normalized === '') {
      setter(formatBeninNational(normalized));
    } else {
      setter(normalized);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setAccountNotFoundNotice(false);
    setSuccessFeedback(null);

    const rawId = loginMethod === 'phone' ? loginPhone.trim() : loginEmail.trim();
    const identifier = normalizeStrictPrefixes(rawId);

    if (!identifier) {
      setErrorFeedback(
        loginMethod === 'phone'
          ? 'Veuillez saisir votre numéro de téléphone.'
          : 'Veuillez saisir votre adresse email.'
      );
      return;
    }

    // Check if it's a pre-registered delivery courier attempting first-time connection
    const preCheck = isDeliveryAccountPreRegistered(identifier);
    if (preCheck.preRegistered) {
      setActivationLogin(preCheck.account!.id);
      setIsDeliveryActivationOpen(true);
      setErrorFeedback(null);
      setSuccessFeedback('Votre compte a été enregistré par la Direction. Veuillez définir votre mot de passe pour finaliser la création de votre compte.');
      return;
    }

    if (!loginPassword) {
      setErrorFeedback('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate against robust secure accounts store
      const result = await authenticateSecureAccount(identifier, loginPassword);

      if (!result.success) {
        setIsSubmitting(false);

        if (result.status === 'LOCKED') {
          setLockoutRemaining(result.secondsRemaining || 30);
          setErrorFeedback(result.message);
          return;
        }

        // Requirement: "Pas d'indication en cas d'accès refusé."
        // Zero-knowledge generic denial: no indication of whether account exists, prefix, or password
        setAccountNotFoundNotice(false);
        setErrorFeedback('Accès refusé. Veuillez vérifier vos identifiants.');
        return;
      }

      // Success
      setSuccessFeedback(`Bienvenue, ${result.userProfile.name}.`);
      
      setTimeout(() => {
        setIsSubmitting(false);
        const isAdmin = result.account.role === 'admin' || !!result.account.isAdmin;
        const isDelivery = result.account.role === 'delivery';
        onLoginSuccess(result.userProfile, isAdmin, isDelivery);
        onClose();
      }, 500);

    } catch (err) {
      setIsSubmitting(false);
      setErrorFeedback('Accès refusé. Veuillez vérifier vos identifiants.');
      console.error(err);
    }
  };

  // Submit Delivery Courier Initial Activation
  const handleDeliveryActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSuccessFeedback(null);

    if (!activationPassword) {
      setErrorFeedback('Veuillez définir votre mot de passe.');
      return;
    }

    if (activationPassword.length < 8) {
      setErrorFeedback('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (activationPassword !== activationPasswordConfirm) {
      setErrorFeedback('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    const res = await activatePreRegisteredDeliveryAccount(activationLogin, activationPassword);
    setIsSubmitting(false);

    if (!res.success || !res.account) {
      setErrorFeedback(res.error || "Impossible d'activer le compte.");
      return;
    }

    setSuccessFeedback('Compte activé avec succès ! Connexion en cours...');
    setTimeout(() => {
      const userProfile: UserProfile = {
        id: res.account!.id,
        name: res.account!.name,
        email: res.account!.email,
        phone: res.account!.phone,
        address: res.account!.address || res.account!.city,
        city: res.account!.city,
        postalCode: '00229',
        country: 'Bénin',
        role: 'delivery',
        isAdmin: false,
        deliveryAgentId: res.account!.deliveryAgentId
      };
      onLoginSuccess(userProfile, false, true);
      onClose();
    }, 700);
  };

  // Submit Forgot Password: Step 1 (Request code)
  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSuccessFeedback(null);

    const targetId = normalizeStrictPrefixes(resetIdentifier.trim());
    if (!targetId) {
      setErrorFeedback('Veuillez renseigner votre numéro de téléphone, email ou identifiant.');
      return;
    }

    setIsResetSubmitting(true);
    const res = requestPasswordReset(targetId);
    setIsResetSubmitting(false);

    if (!res.success) {
      setErrorFeedback(res.message);
      return;
    }

    setSimulatedResetOtp(res.code || null);
    setMaskedResetTarget(res.maskedDestination || null);
    setResetStep('verify');
    setSuccessFeedback('Code de sécurité généré avec succès.');
  };

  // Submit Forgot Password: Step 2 (Verify and set new password)
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSuccessFeedback(null);

    const targetId = normalizeStrictPrefixes(resetIdentifier.trim());
    if (!resetOtpCode.trim()) {
      setErrorFeedback('Veuillez saisir le code de vérification à 6 chiffres.');
      return;
    }

    if (resetNewPassword.length < 8) {
      setErrorFeedback('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (resetNewPassword !== resetNewPasswordConfirm) {
      setErrorFeedback('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsResetSubmitting(true);
    const res = await completePasswordReset(targetId, resetOtpCode.trim(), resetNewPassword);
    setIsResetSubmitting(false);

    if (!res.success) {
      setErrorFeedback(res.message);
      return;
    }

    // Success: return to login with notification
    setAuthMode('login');
    setResetStep('request');
    setResetOtpCode('');
    setResetNewPassword('');
    setResetNewPasswordConfirm('');
    setSimulatedResetOtp(null);
    setSuccessFeedback('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setAccountNotFoundNotice(false);
    setSuccessFeedback(null);

    if (!registerName.trim()) {
      setErrorFeedback('Veuillez saisir votre nom complet.');
      return;
    }

    const cleanPhone = registerPhone.trim();
    const cleanEmail = registerEmail.trim();

    if (registerMethod === 'phone' && !cleanPhone) {
      setErrorFeedback('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    if (registerMethod === 'email' && (!cleanEmail || !cleanEmail.includes('@'))) {
      setErrorFeedback('Veuillez saisir une adresse email valide.');
      return;
    }

    if (!registerPassword) {
      setErrorFeedback('Veuillez définir un mot de passe.');
      return;
    }

    if (registerPassword.length < 8) {
      setErrorFeedback('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setErrorFeedback('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const regResult = await registerSecureAccount({
        name: registerName,
        phone: cleanPhone || (registerMethod === 'email' ? '+229 01 00 00 00 00' : cleanPhone),
        email: cleanEmail || `${sanitizeBeninDigits(cleanPhone)}@client.ora.bj`,
        password: registerPassword,
        city: registerCity,
        address: registerAddress || registerCity,
        role: 'customer'
      });

      if (!regResult.success || !regResult.account) {
        setIsSubmitting(false);
        setErrorFeedback(regResult.error || 'Impossible de créer le compte.');
        return;
      }

      setSuccessFeedback('Compte créé avec succès ! Connexion en cours...');

      setTimeout(async () => {
        setIsSubmitting(false);
        const userProfile: UserProfile = {
          id: regResult.account!.id,
          name: regResult.account!.name,
          email: regResult.account!.email,
          phone: regResult.account!.phone,
          address: regResult.account!.address || regResult.account!.city,
          city: regResult.account!.city,
          postalCode: '00229',
          country: 'Bénin',
          role: 'customer',
          isAdmin: false
        };

        onLoginSuccess(userProfile, false, false);
        onClose();
      }, 600);

    } catch (err) {
      setIsSubmitting(false);
      setErrorFeedback('Erreur lors de la création du compte.');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-7 overflow-hidden text-[#1C1917] max-h-[92vh] flex flex-col border border-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header - Standard, sober and elegant */}
        <div className="mb-4 pr-6 shrink-0">
          <div className="mb-1">
            <span className="font-serif-luxury text-xl font-bold tracking-[0.2em] text-[#1C1917]">
              OrA
            </span>
          </div>

          <h2 className="text-lg font-serif-luxury font-bold text-[#1C1917]">
            {authMode === 'login'
              ? 'Connexion'
              : authMode === 'register'
              ? 'Créer un compte'
              : 'Mot de passe oublié'}
          </h2>

          <p className="text-xs text-stone-500 mt-0.5">
            {authMode === 'login'
              ? 'Connectez-vous pour accéder à votre panier et vos commandes.'
              : authMode === 'register'
              ? 'Renseignez vos coordonnées pour créer votre compte.'
              : 'Récupérez l’accès à votre compte en toute sécurité.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {authMode === 'forgot_password' ? (
          <div className="flex items-center justify-between p-1 bg-stone-100 rounded-xl mb-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorFeedback(null);
                setSuccessFeedback(null);
              }}
              className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-white text-stone-900 shadow-xs flex items-center gap-1.5 hover:bg-stone-50 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
            <span className="text-[11px] font-medium text-stone-500 pr-2">
              Récupération de compte
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorFeedback(null);
                setAccountNotFoundNotice(false);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se connecter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorFeedback(null);
                setAccountNotFoundNotice(false);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer un compte</span>
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">

          {/* Account Not Found Notice (Account must be created first) */}
          {accountNotFoundNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-950">
                    Compte introuvable
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Aucun compte n'est associé à cet identifiant. Veuillez créer votre compte avant de vous connecter.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAccountNotFoundNotice(false);
                  setErrorFeedback(null);
                  if (loginMethod === 'phone') {
                    setRegisterMethod('phone');
                    setRegisterPhone(loginPhone);
                  } else {
                    setRegisterMethod('email');
                    setRegisterEmail(loginEmail);
                  }
                }}
                className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Créer un compte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Standard Error Feedback */}
          {errorFeedback && !accountNotFoundNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="font-medium">
                {errorFeedback}
                {lockoutRemaining !== null && lockoutRemaining > 0 && (
                  <p className="font-bold text-rose-700 mt-1 font-mono">
                    Temps restant : {lockoutRemaining} seconde(s).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Feedback */}
          {successFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successFeedback}</span>
            </div>
          )}

          {/* Delivery Courier Activation Form */}
          {isDeliveryActivationOpen && (
            <form onSubmit={handleDeliveryActivationSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">Création de votre compte Livreur</p>
                <p className="text-[11px] text-amber-800">
                  Votre identifiant <span className="font-mono font-bold">{activationLogin}</span> a été validé par la Direction. Veuillez choisir votre mot de passe pour finaliser la création de votre compte et vous connecter.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 block">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showActivationPassword ? 'text' : 'password'}
                    value={activationPassword}
                    onChange={(e) => setActivationPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActivationPassword(!showActivationPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showActivationPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 block">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={activationPasswordConfirm}
                  onChange={(e) => setActivationPasswordConfirm(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeliveryActivationOpen(false);
                    setErrorFeedback(null);
                    setSuccessFeedback(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Activer & Se connecter'}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 1: SE CONNECTER                                          */}
          {/* ============================================================ */}
          {!isDeliveryActivationOpen && authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4" autoComplete="off">
              
              {/* Selector: Téléphone vs Email */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('phone');
                    setErrorFeedback(null);
                    setAccountNotFoundNotice(false);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    loginMethod === 'phone'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Téléphone</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email');
                    setErrorFeedback(null);
                    setAccountNotFoundNotice(false);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    loginMethod === 'email'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>

              {/* Identifier Input */}
              {loginMethod === 'phone' ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-stone-700">
                      Numéro de téléphone
                    </label>
                    {detectedLoginOp && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BENIN_OPERATORS[detectedLoginOp].badgeBg}`}>
                        {BENIN_OPERATORS[detectedLoginOp].serviceName}
                      </span>
                    )}
                  </div>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => handlePhoneChange(e.target.value, setLoginPhone)}
                      placeholder="01 97 00 12 34"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Adresse email
                    </label>
                    <input
                      type="text"
                      inputMode="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(normalizeStrictPrefixes(e.target.value))}
                      placeholder="adresse@domaine.com"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                    />
                </div>
              )}

              {/* Password Input with Mot de passe oublié */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-700 block">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setErrorFeedback(null);
                      setSuccessFeedback(null);
                      setResetStep('request');
                      setResetIdentifier(loginMethod === 'phone' ? loginPhone : loginEmail);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    autoComplete="new-password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (lockoutRemaining !== null && lockoutRemaining > 0)}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Link to Register */}
              <div className="pt-2 text-center border-t border-stone-100">
                <p className="text-xs text-stone-500">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorFeedback(null);
                      setAccountNotFoundNotice(false);
                    }}
                    className="font-semibold text-stone-900 underline hover:text-black ml-1"
                  >
                    Créer un compte
                  </button>
                </p>
              </div>

            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CRÉER UN COMPTE                                       */}
          {/* ============================================================ */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" autoComplete="off">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 block">
                  Nom et Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Nom complet"
                  autoComplete="off"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                />
              </div>

              {/* Primary Contact Method */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterMethod('phone')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      registerMethod === 'phone'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>Téléphone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterMethod('email')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      registerMethod === 'email'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </button>
                </div>

                {registerMethod === 'phone' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-700">Numéro de téléphone</span>
                      {detectedRegisterOp && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${BENIN_OPERATORS[detectedRegisterOp].badgeBg}`}>
                          {BENIN_OPERATORS[detectedRegisterOp].serviceName}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value, setRegisterPhone)}
                      placeholder="01 97 00 12 34"
                      autoComplete="off"
                      required
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:bg-white focus:border-stone-900"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-stone-700">Adresse email</span>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="adresse@domaine.com"
                      autoComplete="off"
                      required
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:bg-white focus:border-stone-900"
                    />
                  </div>
                )}
              </div>

              {/* City / Commune */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 block">
                    Ville
                  </label>
                  <select
                    value={registerCity}
                    onChange={(e) => setRegisterCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900"
                  >
                    <option value="Cotonou">Cotonou</option>
                    <option value="Abomey-Calavi">Abomey-Calavi</option>
                    <option value="Porto-Novo">Porto-Novo</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Parakou">Parakou</option>
                    <option value="Autre">Autre commune</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 block">
                    Quartier (optionnel)
                  </label>
                  <input
                    type="text"
                    value={registerAddress}
                    onChange={(e) => setRegisterAddress(e.target.value)}
                    placeholder="Quartier de résidence"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-700">
                    Mot de passe <span className="text-rose-500">*</span>
                  </label>
                  {registerPassword && (
                    <span className="text-[10px] text-stone-500">
                      {passwordSecurity.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    autoComplete="new-password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:bg-white focus:border-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    tabIndex={-1}
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Subtle strength bar */}
                {registerPassword && (
                  <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordSecurity.score <= 1
                          ? 'bg-rose-500'
                          : passwordSecurity.score === 2
                          ? 'bg-amber-500'
                          : passwordSecurity.score === 3
                          ? 'bg-emerald-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.max(20, passwordSecurity.percentage)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Password Confirmation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-700">
                    Confirmer le mot de passe <span className="text-rose-500">*</span>
                  </label>
                  {passwordsMatch && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Identique
                    </span>
                  )}
                </div>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  autoComplete="new-password"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>

              {/* Register Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-stone-100">
                <p className="text-xs text-stone-500">
                  Vous avez déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorFeedback(null);
                      setAccountNotFoundNotice(false);
                    }}
                    className="font-semibold text-stone-900 underline hover:text-black ml-1"
                  >
                    Se connecter
                  </button>
                </p>
              </div>

            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 3: MOT DE PASSE OUBLIÉ                                   */}
          {/* ============================================================ */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} noValidate className="space-y-4" autoComplete="off">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 leading-relaxed">
                    Saisissez votre numéro de téléphone ou votre adresse email. Un code de sécurité sera généré pour vous permettre de définir un nouveau mot de passe.
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Numéro de téléphone ou email
                    </label>
                    <input
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(normalizeStrictPrefixes(e.target.value))}
                      placeholder="01 97 00 12 34 ou email de contact"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                  >
                    {isResetSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <span>Recevoir le code de sécurité</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorFeedback(null);
                        setSuccessFeedback(null);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-900 underline"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} noValidate className="space-y-4" autoComplete="off">
                  {/* Simulated OTP Notice for frictionless demo */}
                  {simulatedResetOtp && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800">
                          Code de sécurité {maskedResetTarget ? `(${maskedResetTarget})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetOtpCode(simulatedResetOtp)}
                          className="text-[11px] font-bold text-amber-950 underline hover:text-amber-800"
                        >
                          Insérer le code
                        </button>
                      </div>
                      <div className="text-xl font-mono font-bold tracking-widest text-amber-950 py-0.5">
                        {simulatedResetOtp}
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Saisissez ce code ci-dessous pour confirmer votre identité.
                      </p>
                    </div>
                  )}

                  {/* OTP Code Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Code de vérification (6 chiffres)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Code à 6 chiffres"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-center font-mono text-lg font-bold tracking-widest text-stone-900 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-stone-700 block">
                        Nouveau mot de passe
                      </label>
                      {resetNewPassword && (
                        <span className={`text-[10px] font-semibold ${resetPasswordSecurity.color}`}>
                          {resetPasswordSecurity.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Au moins 8 caractères"
                        autoComplete="new-password"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                        tabIndex={-1}
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Security strength bar */}
                    {resetNewPassword && (
                      <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            resetPasswordSecurity.score <= 1
                              ? 'bg-rose-500'
                              : resetPasswordSecurity.score === 2
                              ? 'bg-amber-500'
                              : resetPasswordSecurity.score === 3
                              ? 'bg-emerald-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.max(20, resetPasswordSecurity.percentage)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-700 block">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      value={resetNewPasswordConfirm}
                      onChange={(e) => setResetNewPasswordConfirm(e.target.value)}
                      placeholder="Répétez le nouveau mot de passe"
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 transition-all"
                    />
                  </div>

                  {/* Complete Button */}
                  <button
                    type="submit"
                    disabled={isResetSubmitting || !resetOtpCode || resetNewPassword.length < 8}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] mt-2"
                  >
                    {isResetSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mise à jour du mot de passe...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Enregistrer le nouveau mot de passe</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('request');
                        setErrorFeedback(null);
                        setSuccessFeedback(null);
                      }}
                      className="text-stone-500 hover:text-stone-900 underline"
                    >
                      Changer d'identifiant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorFeedback(null);
                        setSuccessFeedback(null);
                      }}
                      className="text-stone-500 hover:text-stone-900 underline"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
