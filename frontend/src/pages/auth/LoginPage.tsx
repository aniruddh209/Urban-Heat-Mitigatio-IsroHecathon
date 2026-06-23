import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@urbanheat.ai');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Demo User', role: 'public', email }));
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#030712' }}>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.06]" style={{ background: '#3B82F6' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04]" style={{ background: '#8B5CF6' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-[22px] font-bold text-white tracking-tight">UrbanHeat<span className="text-[#3B82F6]">AI</span></span>
          </Link>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(17,24,39,0.75)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)' }}>
          <div className="text-center mb-7">
            <h1 className="text-[22px] font-bold text-white mb-2">Welcome back</h1>
            <p className="text-[13px] text-[#64748B]">Sign in to the climate intelligence platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#94A3B8] mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[13px] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-white/[0.05] transition-all placeholder:text-[#334155]"
                placeholder="you@email.com" required />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#94A3B8] mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[13px] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-white/[0.05] transition-all pr-12 placeholder:text-[#334155]"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <label className="flex items-center gap-2 text-[#64748B] cursor-pointer">
                <input type="checkbox" className="rounded border-white/10 accent-[#3B82F6]" defaultChecked />
                Remember me
              </label>
              <a href="#" className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.08)' }}>
            <p className="text-[11px] text-[#3B82F6] font-semibold mb-2">🔑 Demo Credentials</p>
            <div className="text-[11px] text-[#475569] space-y-1">
              <p>Admin: admin@urbanheat.ai / admin123</p>
              <p>Researcher: researcher@urbanheat.ai / research123</p>
              <p>Demo: demo@urbanheat.ai / demo123</p>
            </div>
          </div>

          <p className="text-center text-[13px] text-[#475569] mt-6">
            Don't have an account? <Link to="/signup" className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
