import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Database, Activity, Brain, FileText, Server } from 'lucide-react';
import { adminAPI } from '../../services/api';

const CARD = { background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.05)' };
const HEADER = { background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' };

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([adminAPI.dashboard(), adminAPI.users(), adminAPI.logs()]).then(([d, u, l]) => {
      setDashboard(d.data); setUsers(u.data.users || []); setLogs(l.data.logs || []);
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'models', label: 'AI Models', icon: Brain },
    { id: 'logs', label: 'System Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#030712' }}>
      <header className="sticky top-0 z-30" style={HEADER}>
        <div className="max-w-7xl mx-auto flex items-center gap-4" style={{ padding: '0 24px', height: 60 }}>
          <Link to="/dashboard" className="text-[#475569] hover:text-[#3B82F6] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-[15px] font-semibold text-white">Admin Panel</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[11px] text-[#10B981] font-medium">System Operational</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-2" style={{ marginBottom: 20 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl text-[12px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-[#475569] hover:text-[#94A3B8]'
              }`} style={{ padding: '9px 16px', border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent' }}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && dashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Users', value: dashboard.metrics?.total_users, icon: Users, color: '#3B82F6' },
                { label: 'API Calls Today', value: dashboard.metrics?.api_calls_today?.toLocaleString(), icon: Server, color: '#10B981' },
                { label: 'Predictions Today', value: dashboard.metrics?.predictions_today?.toLocaleString(), icon: Brain, color: '#F97316' },
                { label: 'Reports Generated', value: dashboard.metrics?.reports_generated_today, icon: FileText, color: '#EAB308' },
              ].map((m, i) => (
                <div key={i} className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}10`, marginBottom: 14 }}>
                    <m.icon className="w-[18px] h-[18px]" style={{ color: m.color }} />
                  </div>
                  <div className="text-[24px] font-bold text-white">{m.value}</div>
                  <div className="text-[11px] text-[#475569]" style={{ marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
              <h3 className="text-[12px] font-semibold text-[#E2E8F0]" style={{ marginBottom: 14 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dashboard.recent_activity?.map((act: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)' }}>
                    <Activity className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white truncate">{act.action}: <span className="text-[#94A3B8]">{act.target}</span></p>
                      <p className="text-[9px] text-[#475569]">{act.user} • {new Date(act.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
              <h3 className="text-[12px] font-semibold text-[#E2E8F0] flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Database className="w-3.5 h-3.5 text-[#3B82F6]" /> Database Stats
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(dashboard.database || {}).map(([key, val]) => (
                  <div key={key} className="text-center rounded-xl" style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[16px] font-bold text-[#3B82F6]">{typeof val === 'number' ? val.toLocaleString() : val as string}</div>
                    <div className="text-[9px] text-[#475569] capitalize" style={{ marginTop: 4 }}>{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                    <th key={h} className="text-left text-[#475569] font-semibold" style={{ padding: '14px 20px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 20px' }} className="font-medium text-white">{user.name}</td>
                    <td style={{ padding: '12px 20px' }} className="text-[#94A3B8]">{user.email}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-semibold capitalize">{user.role.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="text-[10px] text-[#10B981] flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />{user.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }} className="text-[#475569] text-[10px]">{new Date(user.last_login).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AI Models */}
        {activeTab === 'models' && dashboard?.ai_models && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dashboard.ai_models).map(([key, model]: [string, any]) => (
              <div key={key} className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <Brain className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] font-bold capitalize">{model.status}</span>
                </div>
                <h3 className="font-semibold text-white text-[13px] capitalize">{key.replace(/_/g, ' ')}</h3>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#475569]">Accuracy</span>
                    <span className="text-[#3B82F6] font-bold">{model.accuracy}%</span>
                  </div>
                  <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1]" style={{ width: `${model.accuracy}%` }} />
                  </div>
                  <div className="text-[9px] text-[#475569]">Last trained: {model.last_trained}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logs */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl" style={{ ...CARD, padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl font-mono text-[11px]" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.015)' }}>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'WARNING' ? 'bg-[#EAB308]/10 text-[#EAB308]' :
                    log.level === 'ERROR' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    'bg-[#3B82F6]/10 text-[#3B82F6]'
                  }`}>{log.level}</span>
                  <span className="text-[#475569] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[#94A3B8] flex-1">{log.message}</span>
                  <span className="text-[#334155]">{log.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
