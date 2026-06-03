import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Check, 
  Shield, 
  RefreshCw, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { LoggedUser } from '../types';

interface LoginScreenProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: LoggedUser) => void;
}

export default function LoginScreen({ onNavigate, onLoginSuccess }: LoginScreenProps) {
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot' | 'otp'>('login');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // OTP page states
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');

  // OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (viewState === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [viewState, otpTimer]);

  const handleResendOtp = () => {
    setOtpTimer(45);
    setCanResend(false);
    alert('A new 6-digit verification code has been dispatched to your email address.');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please complete all credential fields.');
      return;
    }

    // Role-based auth logic check:
    // ADMIN check (strictly defined inside our simulated backend)
    if (loginEmail.trim().toLowerCase() === 'admin@shopevalley.com' && loginPassword === 'admin123') {
      const adminUser: LoggedUser = {
        name: 'Shopevalley Administrator',
        email: 'admin@shopevalley.com',
        role: 'ADMIN'
      };
      // Log in and navigate to portal
      onLoginSuccess(adminUser);
      onNavigate('vendor-portal');
      return;
    }

    // Otherwise, check in registered users in localStorage (Role strictly BUYER)
    const existingUsersRaw = localStorage.getItem('sv_registered_users');
    const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

    const foundMatch = existingUsers.find(
      (u: any) => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword
    );

    if (foundMatch) {
      const buyerUser: LoggedUser = {
        name: foundMatch.name,
        email: foundMatch.email,
        role: 'BUYER'
      };
      onLoginSuccess(buyerUser);
      onNavigate('');
      return;
    }

    // Quick preset helper details
    setLoginError('Invalid address or passkey credentials. (For Testing: User details must match registered buyer, or Admin: admin@shopevalley.com / admin123)');
  };

  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!regName || !regEmail || !regPassword) {
      setRegisterError('All information inputs are mandatory.');
      return;
    }

    if (!acceptTerms) {
      setRegisterError('You must check and agree to our Terms & Policies to proceed.');
      return;
    }

    // Simple email collision check
    if (regEmail.trim().toLowerCase() === 'admin@shopevalley.com') {
      setRegisterError('This address is reserved for system administration.');
      return;
    }

    // Head directly to the OTP screen!
    setViewState('otp');
    setOtpTimer(45);
    setCanResend(false);
    setOtpValue(['', '', '', '', '', '']);
  };

  const handleOtpInput = (val: string, index: number) => {
    if (isNaN(Number(val))) return; // only allow numbers
    
    const newOtp = [...otpValue];
    newOtp[index] = val.slice(-1); // store only the last character entered
    setOtpValue(newOtp);

    // Auto-focus next field if text was keyed
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    
    const filledDigits = otpValue.join('');
    if (filledDigits.length < 6) {
      setOtpError('Kindly specify a complete 6-digit security code.');
      return;
    }

    // Success! Save user to local list of buyers (strictly role BUYERS)
    const existingUsersRaw = localStorage.getItem('sv_registered_users');
    const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

    // Save
    const newUserRecord = {
      name: regName,
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: 'BUYER'
    };

    existingUsers.push(newUserRecord);
    localStorage.setItem('sv_registered_users', JSON.stringify(existingUsers));

    // Log the user in
    const buyerSession: LoggedUser = {
      name: regName,
      email: regEmail.trim().toLowerCase(),
      role: 'BUYER'
    };
    
    onLoginSuccess(buyerSession);
    alert('Verification approved successfully! Welcome to Shopevalley.');
    onNavigate('');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Kindly specify your registered email address.');
      return;
    }
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" id="sv_auth_workspace">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md">
        
        {/* Brand Header Display (Just logo) */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-slate-950 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            {viewState === 'login' && 'Log in to your account'}
            {viewState === 'register' && 'Create your account'}
            {viewState === 'forgot' && 'Reset your password'}
            {viewState === 'otp' && 'Email Verification'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {viewState === 'login' && 'Access hand-crafted local products near Denver'}
            {viewState === 'register' && 'Secure your buyer dashboard and check out faster'}
            {viewState === 'forgot' && 'We’ll mail you a secure recovery configuration link'}
            {viewState === 'otp' && `We sent a security passkey to ${regEmail}`}
          </p>
        </div>

        {/* VIEW 1: LOGIN COMPONENT */}
        {viewState === 'login' && (
          <form className="mt-8 space-y-5" onSubmit={handleLoginSubmit} id="sv_login_form">
            {loginError && (
              <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3.5 rounded-xl border border-rose-100 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. buyer@shopevalley.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewState('forgot')}
                    className="text-xs font-extrabold text-[#2563eb] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Testing Info Section */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mt-2.5 text-left">
              <div className="flex gap-2 items-start shrink-0">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wide">Testing Presets Available</h4>
                  <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
                    <strong>Admin Role (Bypasses Frontend, logs to Dashboard)</strong>:<br />
                    Address: <code className="bg-amber-100 px-1 rounded font-mono font-bold">admin@shopevalley.com</code><br />
                    Passkey: <code className="bg-amber-100 px-1 rounded font-mono font-bold">admin123</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              New to our marketplace?{' '}
              <button
                type="button"
                onClick={() => {
                  setViewState('register');
                  setRegisterError('');
                }}
                className="font-extrabold text-[#2563eb] hover:underline cursor-pointer inline-block"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTER COMPONENT */}
        {viewState === 'register' && (
          <form className="mt-8 space-y-5" onSubmit={handleRegisterClick} id="sv_register_form">
            {registerError && (
              <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3.5 rounded-xl border border-rose-100 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{registerError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. buyer@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tick box to agree to terms and conditions */}
              <div className="flex items-start gap-2.5 pt-1 text-left">
                <input
                  type="checkbox"
                  id="accept-terms-check"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 bg-slate-50 border-slate-300 text-slate-950 rounded cursor-pointer accent-slate-950 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                />
                <label htmlFor="accept-terms-check" className="text-xs text-slate-605 select-none cursor-pointer leading-tight">
                  Agree and accept the <span className="font-bold text-slate-950 underline cursor-pointer">Terms of Service</span> and <span className="font-bold text-slate-950 underline cursor-pointer">Privacy Policies</span> of Shopevalley.
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Verify Email/OTP
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Already registered with us?{' '}
              <button
                type="button"
                onClick={() => setViewState('login')}
                className="font-extrabold text-[#2563eb] hover:underline cursor-pointer inline-block"
              >
                Sign In Instead
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: CHECK OTP CODE SCREEN */}
        {viewState === 'otp' && (
          <form className="mt-8 space-y-6 text-left" onSubmit={handleVerifyOtpSubmit} id="sv_otp_form">
            <div className="bg-emerald-50 text-emerald-800 text-xs py-3 px-4 rounded-xl border border-emerald-100 flex gap-2 items-center">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>We've generated a 6-digit test code. Enter any 6 digits to verify.</span>
            </div>

            {otpError && (
              <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3.5 rounded-xl border border-rose-100">
                {otpError}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                Enter 6-Digit OTP Code
              </label>
              
              <div className="flex justify-between gap-1.5 max-w-xs mx-auto">
                {otpValue.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-11 h-12 text-center text-lg font-black border border-slate-300 rounded-xl focus:border-emerald-500 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-slate-950"
                  />
                ))}
              </div>

              {/* Countdown Timer with 45s */}
              <div className="text-center pt-2">
                {otpTimer > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend code in <span className="font-bold text-slate-800">{otpTimer} seconds</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-extrabold text-[#2563eb] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Security Code
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setViewState('register')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold py-3 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md"
              >
                Confirm Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT PASSWORD */}
        {viewState === 'forgot' && (
          <form className="mt-8 space-y-5" onSubmit={handleForgotSubmit} id="sv_forgot_form">
            {forgotSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-inner">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Link Transmitted</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  An exclusive password revision config link was delivered successfully. Please investigate your inbox and follow instruction parameters to restore entry.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewState('login');
                    setForgotSuccess(false);
                    setForgotEmail('');
                  }}
                  className="mt-2 text-xs font-bold text-[#2563eb] underline"
                >
                  Return to sign in screen
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-left">
                      Your Registered Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. yourname@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setViewState('login')}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    Verify Passkey Request
                  </button>
                </div>
              </>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
