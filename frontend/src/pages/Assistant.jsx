import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, UserRound, AlertTriangle, Info } from 'lucide-react';
import { askQuestion } from '../services/assistantService.js';
import { getKnowledgeSources } from '../services/knowledgeService.js';
import ScopeSelector from '../components/assistant/ScopeSelector.jsx';
import ImpactView from '../components/assistant/ImpactView.jsx';
import KnowledgeRiskPanel from '../components/assistant/KnowledgeRiskPanel.jsx';
import './Assistant.css';

const TABS = ['Chat', 'Impact', 'Knowledge Risk'];

const SUGGESTED_QUESTIONS = [
  'Why did users get 401 errors during JWT refresh?',
  'How did we fix the database connection drops?',
  'What changed in the token auth handler?',
];

const TYPE_ICON = {
  commit: '🔀',
  issue: '🐛',
  pr: '🔃',
  doc: '📝',
};

function mapBackendError(msg) {
  if (!msg) return 'The request failed. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('cannot reach') || m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Cannot reach the backend. Check that the FastAPI server is running.';
  if (m.includes('timed out') || m.includes('timeout'))
    return 'The request timed out (60 s). The backend may be busy — please try again.';
  return msg;
}

/**
 * Render answer text, turning [citation-id] tokens into clickable spans.
 * Handles IDs with colons (gh:owner:repo:commit:abc) and # (upload:file.md#2).
 */
function AnswerText({ text, onCiteClick }) {
  if (!text) return null;
  // Split on [...] but keep colons and # inside
  const parts = text.split(/(\[[^\[\]\n]+\])/g);
  return (
    <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\[\]\n]+)\]$/);
        if (m) {
          const id = m[1];
          return (
            <button key={i} className="citation-btn" type="button" onClick={() => onCiteClick(id)} title={`Go to source: ${id}`}>
              [{id}]
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function SourceCard({ source, highlighted }) {
  const icon = TYPE_ICON[source.type] || '📄';
  return (
    <a
      className={`assistant-source ${highlighted ? 'source-highlighted' : ''}`}
      data-source-id={source.id}
      href={source.url || '#'}
      target={source.url ? '_blank' : undefined}
      rel="noreferrer"
      onClick={!source.url ? (e) => e.preventDefault() : undefined}
    >
      <div className="source-card-top">
        <span className="source-type-icon">{icon}</span>
        <strong className="source-card-id">{source.id}</strong>
        {source.url && <span className="source-ext-icon">↗</span>}
      </div>
      {source.snippet && <span className="source-card-snippet">{source.snippet}</span>}
    </a>
  );
}

function ConfidenceBadge({ confidence }) {
  if (!confidence || confidence === 'none') return null;
  return <span className={`conf-badge conf-${confidence}`}>{confidence} confidence</span>;
}

function ChatTab({ scope }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleCiteClick(id, messageIndex) {
    setHighlightedId(id);
    // Find source card by data attribute — safe for colons and # in IDs
    const container = document.querySelector(`[data-message-index="${messageIndex}"]`);
    if (container) {
      const el = container.querySelector(`[data-source-id="${CSS.escape(id)}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => setHighlightedId(''), 2500);
  }

  async function submitQuestion(value) {
    const trimmed = (value ?? question).trim();
    if (!trimmed || isLoading) return;

    setQuestion('');
    setIsLoading(true);
    setMessages((cur) => [...cur, { role: 'user', text: trimmed }]);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timed out')), 60000)
    );

    try {
      const response = await Promise.race([askQuestion(trimmed), timeout]);
      setMessages((cur) => [
        ...cur,
        {
          role: response.found === false ? 'not-found' : 'assistant',
          text: response.answer,
          sources: response.sources || [],
          confidence: response.confidence,
          found: response.found,
        },
      ]);
    } catch (err) {
      setMessages((cur) => [
        ...cur,
        { role: 'error', text: mapBackendError(err.message) },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="assistant-chat">
      <div className="assistant-messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="assistant-welcome">
            <span className="assistant-welcome-icon"><Bot size={28} /></span>
            <h2>What would you like to know?</h2>
            <p>Answers are based on the project history loaded into the knowledge base.</p>
            <div className="assistant-suggestions">
              {SUGGESTED_QUESTIONS.map((s) => (
                <button
                  key={s}
                  className="assistant-suggestion"
                  onClick={() => submitQuestion(s)}
                  disabled={isLoading}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <article
              key={idx}
              data-message-index={idx}
              className={`assistant-message assistant-message-${msg.role === 'not-found' ? 'not-found' : msg.role}`}
            >
              <span className="assistant-message-avatar" aria-hidden="true">
                {msg.role === 'user' ? <UserRound size={17} /> : <Bot size={17} />}
              </span>
              <div className="assistant-message-body">
                {msg.role === 'not-found' ? (
                  <div className="chat-not-found">
                    <Info size={14} />
                    <span>{msg.text || "I couldn't find this in the project history."}</span>
                  </div>
                ) : (
                  <AnswerText
                    text={msg.text}
                    onCiteClick={(id) => handleCiteClick(id, idx)}
                  />
                )}

                {msg.role === 'assistant' && msg.sources?.length > 0 && (
                  <div className="assistant-sources">
                    <h3>Sources</h3>
                    {msg.sources.map((s) => (
                      <SourceCard
                        key={s.id}
                        source={s}
                        highlighted={highlightedId === s.id}
                      />
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && <ConfidenceBadge confidence={msg.confidence} />}
              </div>
            </article>
          ))
        )}
        {isLoading && (
          <div className="assistant-loading" role="status">
            <span className="assistant-spinner" />
            Searching project knowledge…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="assistant-composer" onSubmit={(e) => { e.preventDefault(); submitQuestion(); }}>
        <label className="assistant-composer-label" htmlFor="assistant-question">Your question</label>
        <textarea
          id="assistant-question"
          maxLength={1000}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); }
          }}
          placeholder="Ask a question about your project…"
          rows={3}
          value={question}
          disabled={isLoading}
        />
        <div className="assistant-composer-footer">
          <span>{question.length}/1000 · Enter to send, Shift+Enter for new line</span>
          <button
            className="btn btn-primary"
            disabled={!question.trim() || isLoading}
            type="submit"
          >
            <Send size={16} /> Ask
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Assistant page ────────────────────────────────────────────────────────

export default function Assistant() {
  const [activeTab, setActiveTab] = useState('Chat');
  const [scope, setScope] = useState('');
  const [repositories, setRepositories] = useState([]);

  // Load repository list for scope selector
  useEffect(() => {
    getKnowledgeSources()
      .then((data) => setRepositories(data.repositories || []))
      .catch(() => {}); // non-fatal: scope just shows no repos
  }, []);

  return (
    <section className="assistant-page">
      <header className="assistant-heading">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Ask questions, analyze impact, or check knowledge risk.</p>
        </div>
        <span className="assistant-api-status">
          <span className="assistant-status-dot" />
          Backend-powered
        </span>
      </header>

      {/* Scope selector + tab bar */}
      <div className="assistant-toolbar">
        <div className="assistant-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`cat-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <ScopeSelector scope={scope} onChange={setScope} repositories={repositories} />
      </div>

      {activeTab === 'Chat' && <ChatTab scope={scope} />}
      {activeTab === 'Impact' && <ImpactView scope={scope} />}
      {activeTab === 'Knowledge Risk' && <KnowledgeRiskPanel scope={scope} />}
    </section>
  );
}
