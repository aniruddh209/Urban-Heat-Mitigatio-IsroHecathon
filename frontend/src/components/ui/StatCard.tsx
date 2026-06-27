import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════
   Animated Stat Card — Count-up animation with trend badge
   ═══════════════════════════════════════════════════════════ */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  color: string;
}

export default function StatCard({ icon: Icon, label, value, unit, trend, color }: StatCardProps) {
  const [displayVal, setDisplayVal] = useState<string | number>(typeof value === 'number' ? 0 : value);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (typeof value !== 'number' || animated.current) {
      setDisplayVal(value);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const duration = 1800;
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayVal(Math.floor(eased * (value as number)));
          if (progress < 1) requestAnimationFrame(animate);
          else setDisplayVal(value);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      className="rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
      style={{
        background: 'rgba(17,24,39,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 22px',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
          style={{ background: `${color}10` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
            trend.startsWith('-') ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
          }`}>{trend}</span>
        )}
      </div>
      <p className="text-[26px] font-bold text-white leading-none tabular-nums">
        {displayVal}
        {unit && <span className="text-[12px] text-[#475569] ml-1 font-normal">{unit}</span>}
      </p>
      <p className="text-[11px] text-[#64748B]" style={{ marginTop: 6 }}>{label}</p>
    </div>
  );
}
