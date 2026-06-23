import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Satellite, Activity, Shield, Map, Brain, TreePine, Thermometer, BarChart3, Zap, Globe, ChevronDown, Menu, X, Mail, MapPin, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';

/* ============================================================
   ANIMATED GRID BACKGROUND
   ============================================================ */
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      {/* Top-left glow */}
      <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />
      {/* Bottom-right glow */}
      <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
    </div>
  );
}

/* ============================================================
   ANIMATED EARTH ORB
   ============================================================ */
function EarthOrb() {
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[420px] md:h-[420px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-[#3B82F6]/5 blur-[80px] animate-pulse-glow" />
      <div className="absolute inset-8 md:inset-12 rounded-full overflow-hidden border border-[#3B82F6]/10"
        style={{ background: 'radial-gradient(circle at 35% 35%, #1a3a6a, #0d1f40 40%, #050a18 75%)', boxShadow: 'inset -30px -30px 60px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)' }}>
        <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(ellipse 40px 60px at 38% 35%, #10B981 0%, transparent 70%), radial-gradient(ellipse 25px 35px at 55% 50%, #10B981 0%, transparent 70%), radial-gradient(ellipse 30px 20px at 65% 30%, #10B981 0%, transparent 70%), radial-gradient(ellipse 50px 30px at 30% 60%, #10B981 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-35" style={{ background: 'radial-gradient(circle 20px at 40% 38%, #F97316 0%, transparent 70%), radial-gradient(circle 15px at 55% 42%, #EF4444 0%, transparent 70%), radial-gradient(circle 12px at 35% 55%, #F97316 0%, transparent 70%)' }} />
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(59,130,246,0.06) 80%, rgba(59,130,246,0.12) 100%)' }} />
      </div>
      <div className="absolute inset-0 rounded-full border border-[#3B82F6]/8 animate-rotate-slow" />
      <div className="absolute inset-[-10px] rounded-full border border-dashed border-[#8B5CF6]/5 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '50s' }} />
      <div className="absolute top-1/2 left-1/2 w-0 h-0 animate-orbit">
        <Satellite className="w-5 h-5 text-[#3B82F6]" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))' }} />
      </div>
    </div>
  );
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */
function Counter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const startTime = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / 2000, 1);
          setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * value));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold gradient-text">{count.toLocaleString()}{suffix}</div>
      <div className="text-[13px] text-[#64748B] mt-2 font-medium">{label}</div>
    </div>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const features = [
    { icon: Thermometer, title: 'Heat Island Detection', description: 'AI-powered UHI detection using satellite imagery, NDVI, NDBI, and Land Surface Temperature with XGBoost.', color: '#F97316' },
    { icon: Brain, title: 'Explainable AI Engine', description: 'SHAP-based explanations, confidence scores, feature importance, and natural language reasoning chains.', color: '#8B5CF6' },
    { icon: Activity, title: '"What If" Simulation', description: 'Simulate green cover, cool roofs, water bodies, and urban forests — measure impact before implementation.', color: '#3B82F6' },
    { icon: TreePine, title: 'Tree Plantation AI', description: 'Optimal tree count, species selection, plantation zones, cooling estimates, and cost projections.', color: '#10B981' },
    { icon: Shield, title: 'Heatwave Alert System', description: 'Real-time emergency alerts with population risk, hospital coverage, and automated heat advisories.', color: '#EF4444' },
    { icon: BarChart3, title: 'Vulnerability Ranking', description: 'Rank 100+ Indian cities by heat risk, population impact, green deficit, and cooling urgency.', color: '#06B6D4' },
    { icon: Map, title: 'Satellite Maps', description: 'Multi-layer satellite maps with heat, AQI, vegetation overlays and click-for-insights analytics.', color: '#EAB308' },
    { icon: Zap, title: 'AI Cooling Plans', description: 'Auto-generate immediate to 10-year strategies with budget estimates and carbon reduction targets.', color: '#EC4899' },
  ];

  const tech = [
    { name: 'React', desc: 'Frontend' }, { name: 'TypeScript', desc: 'Type Safety' }, { name: 'FastAPI', desc: 'Backend' },
    { name: 'XGBoost', desc: 'UHI Detection' }, { name: 'PyTorch', desc: 'Deep Learning' }, { name: 'SHAP', desc: 'Explainable AI' },
    { name: 'Leaflet', desc: 'Maps' }, { name: 'PostgreSQL', desc: 'Database' }, { name: 'Redis', desc: 'Cache' }, { name: 'Docker', desc: 'Deploy' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#030712' }}>
      <GridBackground />

      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}
        style={scrolled ? { background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(40px) saturate(1.5)', borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-[16px] font-bold text-white tracking-tight">UrbanHeat<span className="text-[#3B82F6]">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-[#64748B] hover:text-white transition-colors font-medium">Features</a>
            <a href="#technology" className="text-[13px] text-[#64748B] hover:text-white transition-colors font-medium">Technology</a>
            <a href="#impact" className="text-[13px] text-[#64748B] hover:text-white transition-colors font-medium">Impact</a>
            <Link to="/login" className="btn-ghost text-[13px]">Log In</Link>
            <Link to="/dashboard" className="btn-primary text-[13px] !py-2.5 !px-5">Launch Dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 mx-4 p-4 rounded-2xl space-y-2 animate-fade-in-down" style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)' }}>
            <a href="#features" className="block py-2.5 px-3 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/[0.03]" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#technology" className="block py-2.5 px-3 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/[0.03]" onClick={() => setMobileMenuOpen(false)}>Technology</a>
            <a href="#impact" className="block py-2.5 px-3 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/[0.03]" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <Link to="/login" className="block py-2.5 px-3 text-[#3B82F6]" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link to="/dashboard" className="btn-primary w-full text-center !py-2.5" onClick={() => setMobileMenuOpen(false)}>Launch Dashboard</Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-7 relative z-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold text-[#3B82F6] tracking-wide"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Sparkles className="w-3.5 h-3.5" /> ISRO Bharatiya Antariksh Hackathon 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight">
              <span className="gradient-text">Climate Intelligence</span><br />
              <span className="text-white">Powered by AI</span>
            </h1>
            <p className="text-[16px] sm:text-[17px] text-[#94A3B8] leading-relaxed max-w-lg mx-auto lg:mx-0">
              Identify Urban Heat Islands, predict climate trends, and generate actionable cooling strategies for{' '}
              <span className="text-white font-medium">100+ Indian cities</span> using satellite data and ML.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/dashboard" className="btn-primary !py-3.5 !px-7 text-[14px]"><Zap className="w-4 h-4" /> Launch Platform</Link>
              <a href="#features" className="btn-secondary !py-3.5 !px-7 text-[14px]">Explore Features <ChevronDown className="w-4 h-4" /></a>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '200ms' }}><EarthOrb /></div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="w-5 h-5 text-[#334155]" /></div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative py-16 sm:py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <Counter value={100} label="Cities Monitored" suffix="+" />
          <Counter value={15847} label="AI Predictions" />
          <Counter value={329} label="Active Alerts" />
          <Counter value={8} label="AI Models" />
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[12px] font-semibold text-[#3B82F6] uppercase tracking-[0.15em] mb-3">Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Everything you need for<br /><span className="gradient-text">urban heat intelligence</span></h2>
            <p className="text-[#64748B] max-w-xl mx-auto text-[14px] sm:text-[15px]">Comprehensive AI-powered tools for heat analysis, prediction, simulation, and mitigation planning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-5 sm:p-6 glow-border group animate-fade-in-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 transition-transform group-hover:scale-110" style={{ background: `${f.color}10` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECHNOLOGY ===== */}
      <section id="technology" className="relative py-20 sm:py-28" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[12px] font-semibold text-[#8B5CF6] uppercase tracking-[0.15em] mb-3">Technology</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Built with <span className="gradient-text">cutting-edge</span> stack</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {tech.map((t, i) => (
              <div key={i} className="glass-card p-4 sm:p-5 text-center group glow-border animate-scale-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
                <div className="text-[14px] sm:text-[15px] font-bold text-white group-hover:text-[#3B82F6] transition-colors">{t.name}</div>
                <div className="text-[10px] sm:text-[11px] text-[#475569] mt-1">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SDG IMPACT ===== */}
      <section id="impact" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[12px] font-semibold text-[#10B981] uppercase tracking-[0.15em] mb-3">Impact</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">SDG Alignment & <span className="gradient-text">Research Impact</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              { sdg: 'SDG 11', title: 'Sustainable Cities', desc: 'Making cities resilient through AI-driven urban heat management.', color: '#F97316', score: 78 },
              { sdg: 'SDG 13', title: 'Climate Action', desc: 'Data-driven heat mitigation strategies and early warning systems.', color: '#10B981', score: 82 },
              { sdg: 'SDG 3', title: 'Good Health', desc: 'Reducing heat-related illness through predictive alerts and cooling plans.', color: '#3B82F6', score: 65 },
            ].map((s, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 text-center relative overflow-hidden glow-border">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
                <div className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: s.color }}>{s.sdg}</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-[12px] sm:text-[13px] text-[#64748B] mb-5">{s.desc}</p>
                <div className="w-full bg-white/[0.04] rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.score}%`, background: s.color }} />
                </div>
                <div className="text-[11px] text-[#475569] mt-2">Alignment: {s.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-5">Ready to combat <span className="gradient-text">urban heat</span>?</h2>
          <p className="text-[#64748B] mb-8 text-[15px] sm:text-[16px]">Launch the platform to explore satellite heat maps, AI predictions, and cooling strategies for 100+ Indian cities.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="btn-primary !py-3.5 !px-8 text-[14px]"><Zap className="w-4 h-4" /> Launch Dashboard</Link>
            <Link to="/signup" className="btn-secondary !py-3.5 !px-8 text-[14px]">Create Account</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative py-12 sm:py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-[14px]">UrbanHeat<span className="text-[#3B82F6]">AI</span></span>
              </div>
              <p className="text-[13px] text-[#475569] leading-relaxed">AI-Powered Climate Intelligence for Urban Heat Island Detection & Mitigation.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-[13px] mb-4">Platform</h4>
              <ul className="space-y-2.5 text-[13px]">
                {[['Dashboard','/dashboard'],['Simulation','/simulation'],['Rankings','/vulnerability'],['AI Chat','/assistant']].map(([l,h]) => (
                  <li key={l}><Link to={h} className="text-[#475569] hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-[13px] mb-4">Resources</h4>
              <ul className="space-y-2.5 text-[13px] text-[#475569]">
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Research Paper</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Architecture</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-[13px] mb-4">Contact</h4>
              <ul className="space-y-2.5 text-[13px] text-[#475569]">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> team@urbanheat.ai</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> India</li>
              </ul>
            </div>
          </div>
          <div className="glow-line mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#334155]">© 2026 UrbanHeat AI — ISRO BAH 2026</p>
            <p className="text-[12px] text-[#334155]">Built with ❤️ for India's Climate Future</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
