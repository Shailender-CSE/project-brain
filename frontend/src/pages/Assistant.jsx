import { useState } from 'react';
import { Bot, Send, UserRound } from 'lucide-react';
import { askQuestion } from '../services/assistantService.js';
import './Assistant.css';

const SUGGESTED_QUESTIONS = [
  'Why did users get 401 errors during JWT refresh?',
  'How did we fix the database connection drops?',
  'What changed in the token auth handler?',
];

export default function Assistant() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function submitQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setQuestion('');
    setIsLoading(true);
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);

    try {
      const response = await askQuestion(trimmed);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.answer,
          sources: response.sources || [],
          confidence: response.confidence,
        },
      ]);
    } catch (error) {
      setQuestion(trimmed);
      setMessages((current) => [
        ...current,
        {
          role: 'error',
          text: error.message || 'The request failed. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion();
  }

  return (
    <section className="assistant-page">
      <header className="assistant-heading">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">
            Ask questions about your project history and knowledge.
          </p>
        </div>
        <span className="assistant-api-status">
          <span className="assistant-status-dot" />
          Backend-powered
        </span>
      </header>

      <div className="assistant-chat">
        <div className="assistant-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <span className="assistant-welcome-icon"><Bot size={28} /></span>
              <h2>What would you like to know?</h2>
              <p>Answers are based on the project history loaded into the knowledge base.</p>
              <div className="assistant-suggestions">
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <button
                    className="assistant-suggestion"
                    key={suggestion}
                    onClick={() => submitQuestion(suggestion)}
                    disabled={isLoading}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <article className={`assistant-message assistant-message-${message.role}`} key={`${index}-${message.role}`}>
                <span className="assistant-message-avatar" aria-hidden="true">
                  {message.role === 'user' ? <UserRound size={17} /> : <Bot size={17} />}
                </span>
                <div className="assistant-message-body">
                  <p>{message.text}</p>
                  {message.role === 'assistant' && message.sources?.length > 0 && (
                    <div className="assistant-sources">
                      <h3>Sources</h3>
                      {message.sources.map((source) => (
                        <a
                          className="assistant-source"
                          href={source.url}
                          key={source.id}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <strong>{source.id}</strong>
                          {source.snippet && <span>{source.snippet}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                  {message.role === 'assistant' && message.confidence && message.confidence !== 'none' && (
                    <span className="assistant-confidence">
                      {message.confidence} confidence
                    </span>
                  )}
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
        </div>

        <form className="assistant-composer" onSubmit={handleSubmit}>
          <label className="assistant-composer-label" htmlFor="assistant-question">
            Your question
          </label>
          <textarea
            id="assistant-question"
            maxLength={1000}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Ask a question about your project…"
            rows={3}
            value={question}
          />
          <div className="assistant-composer-footer">
            <span>{question.length}/1000 · Enter to send, Shift+Enter for a new line</span>
            <button className="btn btn-primary" disabled={!question.trim() || isLoading} type="submit">
              <Send size={16} />
              Ask
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
