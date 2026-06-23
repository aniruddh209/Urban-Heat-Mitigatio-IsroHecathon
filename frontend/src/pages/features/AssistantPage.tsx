import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, Lightbulb, Brain } from 'lucide-react';
import { assistantAPI } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  sources?: string[];
  related?: string[];
  timestamp: string;
}

/* Simple markdown renderer for bold, bullet points, headers, tables */
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('**') && line.endsWith('**') && !line.includes('|')) {
          return <div key={i} className="font-bold text-white text-[13px] mt-2">{line.replace(/\*\*/g, '')}</div>;
        }
        // Table header separator
        if (line.match(/^\|[\s-|]+\|$/)) return null;
        // Table rows
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.split('|').filter(c => c.trim());
          const isHeader = lines[i+1]?.match(/^\|[\s-|]+\|$/);
          return (
            <div key={i} className={`grid gap-1 text-[11px] px-2 py-1.5 rounded-lg ${isHeader ? 'bg-white/[0.04] font-semibold text-slate-300' : 'text-slate-400'}`}
              style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
              {cells.map((cell, j) => {
                let content = cell.trim();
                // Bold
                content = content.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');
                // Color coded
                content = content.replace(/🟢/g, '<span class="text-emerald-400">✓</span>');
                content = content.replace(/🔴/g, '<span class="text-red-400">●</span>');
                content = content.replace(/🟠/g, '<span class="text-orange-400">●</span>');
                content = content.replace(/🟡/g, '<span class="text-amber-400">●</span>');
                return <span key={j} dangerouslySetInnerHTML={{ __html: content }} />;
              })}
            </div>
          );
        }
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          let content = line.slice(2);
          content = content.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');
          return (
            <div key={i} className="flex items-start gap-2 text-[12px] text-slate-300 pl-1">
              <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }
        // Numbered items
        if (line.match(/^\d+\.\s/)) {
          let content = line.replace(/^\d+\.\s/, '');
          content = content.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');
          const num = line.match(/^(\d+)/)?.[1];
          return (
            <div key={i} className="flex items-start gap-2 text-[12px] text-slate-300 pl-1">
              <span className="text-cyan-400 font-bold shrink-0 w-4">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }
        // Empty line
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        // Regular text with bold
        let content = line;
        content = content.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');
        return <div key={i} className="text-[12px] text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
      })}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 **Hello! I\'m the UrbanHeat AI Assistant.**\n\nI can help you with:\n• 🌡️ **Weather & Temperature** — Current conditions for any Indian city\n• 🏙️ **UHI Analysis** — Why cities are getting hotter\n• 🌳 **Tree Planting** — How many trees a city needs\n• 🔮 **10-Year Forecasts** — Climate predictions\n• ❄️ **Cooling Strategies** — Actionable mitigation plans\n• 📊 **City Comparisons** — Compare heat risk between cities\n• 📡 **Satellite Data** — What data sources we use\n\nTry asking a question below! 👇',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    assistantAPI.suggestedQueries().then(res => setSuggestions(res.data.queries || []));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await assistantAPI.chat(msg);
      const data = res.data;
      const botMsg: Message = {
        role: 'assistant',
        content: data.response,
        confidence: data.confidence,
        sources: data.sources,
        related: data.related_queries,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#030712' }}>
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-30" style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4" style={{ padding: '0 24px', height: 60 }}>
          <Link to="/dashboard" className="text-[#475569] hover:text-[#3B82F6] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white">AI Urban Planning Assistant</h1>
              <p className="text-[10px] text-[#10B981] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse" /> Online • v2.0</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full">
        <div className="space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in-up`}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0 mt-1 border border-[#3B82F6]/15">
                  <Bot className="w-4 h-4 text-[#3B82F6]" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#3B82F6]/8 border border-[#3B82F6]/15 text-white ml-auto'
                    : 'border border-white/[0.05]'
                }`} style={{ padding: 16, ...(msg.role === 'assistant' ? { background: 'rgba(17,24,39,0.6)' } : {}) }}>
                  {msg.role === 'assistant' ? (
                    <RenderMarkdown text={msg.content} />
                  ) : (
                    <p className="text-[13px] text-white">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'assistant' && msg.confidence && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[10px] text-[#475569] px-1">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#3B82F6]" /> Confidence: <b className="text-[#3B82F6]">{msg.confidence}%</b></span>
                    {msg.sources?.map((s, j) => (
                      <span key={j} className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">{s}</span>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && msg.related && msg.related.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 px-1">
                    {msg.related.map((q, j) => (
                      <button key={j} onClick={() => sendMessage(q)}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0 mt-1 border border-[#F97316]/15">
                  <User className="w-4 h-4 text-[#F97316]" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0 border border-[#3B82F6]/15">
                <Bot className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div className="rounded-2xl border border-white/[0.05]" style={{ padding: 16, background: 'rgba(17,24,39,0.6)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] text-slate-500 ml-1">Analyzing data...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions (show only when few messages) */}
        {messages.length <= 1 && (
          <div className="mt-8">
            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Try asking:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.query)}
                  className="text-left p-3.5 rounded-xl border border-white/[0.06] hover:border-cyan-500/15 transition-all text-[12px] text-slate-400 hover:text-slate-200 group"
                  style={{ background: 'rgba(15,23,42,0.3)' }}>
                  <span className="text-[10px] text-cyan-400/50 block mb-1 font-medium">{s.category}</span>
                  <span className="group-hover:text-white transition-colors">{s.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0" style={{ padding: 16, background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto flex gap-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about weather, UHI, cooling strategies, tree planting..."
            disabled={loading}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#3B82F6]/30 placeholder:text-[#334155] disabled:opacity-50 transition-all" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="btn-primary !py-3 disabled:opacity-30">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
