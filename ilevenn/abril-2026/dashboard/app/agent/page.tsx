'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, TrendingUp, Search, Target, BookOpen, Sparkles, Calculator } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Message } from '@/lib/types';

const SUGGESTIONS = [
  { icon: <TrendingUp size={14} />, text: 'Analiza el próximo clásico Real Madrid vs Barcelona y detecta value bets' },
  { icon: <Search size={14} />, text: 'Investiga al tipster @BetExpert: su ROI, historial y fiabilidad' },
  { icon: <Target size={14} />, text: '¿Cómo implemento una estrategia de value betting ganadora a largo plazo?' },
  { icon: <Calculator size={14} />, text: 'Calcula el Kelly Criterion para una apuesta con cuota 2.5 y probabilidad real del 48%' },
  { icon: <BookOpen size={14} />, text: 'Explícame qué es el Closing Line Value y por qué es el mejor indicador de apuestas' },
  { icon: <Sparkles size={14} />, text: 'Dame 3 value bets para el fútbol europeo de este fin de semana' },
];

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^\| (.+) \|$/gm, (_, row) => `<tr>${row.split(' | ').map((cell: string) => `<td>${cell.trim()}</td>`).join('')}</tr>`)
    .replace(/(<tr>.*<\/tr>\n?)+/gm, (match) => {
      const rows = match.trim().split('\n');
      const header = rows[0];
      const headerCells = header.replace(/<tr>|<\/tr>/g, '').replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      const body = rows.slice(2).join('\n');
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gm, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const send = async (text?: string) => {
    const query = text || input.trim();
    if (!query || streaming) return;
    setInput('');

    const userMessage: Message = { role: 'user', content: query };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setStreaming(true);
    setStreamText('');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullText += data.text;
              setStreamText(fullText);
            } else if (data.type === 'done') {
              setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
              setStreamText('');
            } else if (data.type === 'error') {
              setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }]);
              setStreamText('');
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error de conexión. Verifica tu API key de Anthropic.` }]);
      setStreamText('');
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clear = () => {
    if (messages.length === 0) return;
    if (confirm('¿Borrar conversación?')) setMessages([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px 32px 0' }}>
      <PageHeader
        title="Agente IA de Apuestas"
        subtitle="Análisis en tiempo real · Detección de value bets · Research de tipsters"
        actions={
          <button onClick={clear} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={13} /> Borrar
          </button>
        }
      />

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {messages.length === 0 && !streamText ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
            <div style={{ width: 56, height: 56, background: 'var(--accent-dim)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bot size={28} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Agente Experto en Apuestas</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 480, marginBottom: 28, lineHeight: 1.6 }}>
              Analizo partidos con datos en tiempo real, detecto value bets, investigo tipsters y diseño estrategias ganadoras. Powered by Claude con búsqueda web.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 680, width: '100%' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s.text)} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  lineHeight: 1.4,
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {streamText && (
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 12px 12px 12px', padding: '12px 16px' }}>
                  <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamText) }} />
                  <span style={{ display: 'inline-block', width: 6, height: 14, background: 'var(--accent)', marginLeft: 2, animation: 'blink 1s infinite', borderRadius: 2 }} />
                </div>
              </div>
            )}
            {streaming && !streamText && (
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="var(--accent)" />
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 12px 12px 12px', padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0 20px', maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px 8px 14px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre partidos, value bets, tipsters, metodologías..."
            rows={1}
            disabled={streaming}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, resize: 'none', minHeight: 24, maxHeight: 120, overflowY: 'auto',
              lineHeight: 1.5, padding: '4px 0',
            }}
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: 8, background: streaming || !input.trim() ? 'var(--surface-2)' : 'var(--accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'background 0.15s',
            }}>
            <Send size={15} color={streaming || !input.trim() ? 'var(--text-muted)' : 'white'} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Enter para enviar · Shift+Enter para nueva línea · Búsqueda web en tiempo real activada
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: isUser ? 'rgba(108,99,255,0.2)' : 'var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={16} color="#818cf8" /> : <Bot size={16} color="var(--accent)" />}
      </div>
      <div style={{
        flex: 1,
        background: isUser ? 'rgba(108,99,255,0.08)' : 'var(--surface)',
        border: `1px solid ${isUser ? 'rgba(108,99,255,0.2)' : 'var(--border)'}`,
        borderRadius: isUser ? '12px 0 12px 12px' : '0 12px 12px 12px',
        padding: '12px 16px',
        maxWidth: '85%',
      }}>
        {isUser ? (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#e2e8f0' }}>{msg.content}</p>
        ) : (
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        )}
      </div>
    </div>
  );
}
