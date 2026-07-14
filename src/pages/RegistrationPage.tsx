import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { User as UserIcon, Mail, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { useDragToScroll } from '../hooks/useDragToScroll';
import { auth } from '../lib/firebase';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';

interface RegistrationPageProps {
  onComplete: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onComplete }) => {
  const { setUser, playClick } = useAppContext();
  const scrollRef = useDragToScroll();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);


  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      setMessage('');
      return;
    }

    playClick();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent to your email.');
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email.');
      } else {
        setError(err.message || 'An error occurred during password reset.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!email.trim() || !password.trim() || (!isLoginMode && !name.trim())) {
      setError('Please fill in all required fields');
      setMessage('');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      setMessage('');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setMessage('');
      return;
    }

    playClick();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Set persistence based on Remember Me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Handle Remember Me for email
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        setUser({ name: userCredential.user.displayName || 'Player', email });
        onComplete();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with the name entered
        await updateProfile(userCredential.user, { displayName: name });

        // Handle Remember Me for email
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        setUser({ name, email });
        onComplete();
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in instead.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console. Please enable it.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'An authentication error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full w-full flex flex-col bg-emerald-50 px-8 py-12 pb-24 overflow-y-auto select-none"
    >
      <div className="flex flex-col items-center mb-10 pt-10">
        <h1
          className="text-4xl font-cooper text-emerald-500 text-center leading-tight drop-shadow-xl"
          style={{
            textShadow: '3px 3px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
          }}
        >
          LUCKY OR NOT
        </h1>
        <p className="text-slate-500 font-bold text-center mt-3 text-sm italic">
          Test your luck in mini games!
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
        {/* Only show Name field if registering */}
        {!isLoginMode && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Player Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-4 pr-12 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {isLoginMode && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleForgotPassword}
                className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors disabled:text-slate-300"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-1">
          <label className="relative flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${rememberMe ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rememberMe ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></div>
            </div>
            <span className="ml-3 text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Beni Tanı</span>
          </label>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100"
          >
            {error}
          </motion.p>
        )}
        
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-500 text-sm font-bold text-center bg-emerald-50 p-3 rounded-xl border border-emerald-100"
          >
            {message}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full bg-emerald-500 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              {isLoginMode ? 'Login' : 'Get Started'}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </>
          )}
        </button>

        <div className="flex justify-center mt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setMessage('');
            }}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors disabled:text-slate-400"
          >
            {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>

      </form>


      <p className="mt-auto text-center text-slate-400 text-xs font-medium">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default RegistrationPage;
