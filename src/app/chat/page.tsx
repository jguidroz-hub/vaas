'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  options?: string[];
}

// Structured intake flow — no LLM cost, fast, guides users to better submissions
const FLOW_STEPS = [
  {
    id: 'greeting',
    message: "👋 I'm here to help you shape your idea before we put it through the Guardian. The more detail you provide, the better the validation. Let's start — **what problem are you trying to solve?**",
  },
  {
    id: 'problem',
    message: "Good. Now, **who has this problem?** Be specific — \"small business owners\" is okay, \"restaurant managers with 20+ staff in urban areas\" is great.",
  },
  {
    id: 'audience',
    message: "**How do people solve this problem today?** (Existing tools, manual workarounds, or nothing at all)",
  },
  {
    id: 'existing',
    message: "Interesting. **What's your proposed solution?** Describe what your product would actually do.",
  },
  {
    id: 'solution',
    message: "**What makes your approach different or better** than what exists? (Technology, positioning, niche focus, timing, etc.)",
  },
  {
    id: 'differentiation',
    message: "Almost done. **How would you charge for this?**",
    options: ['Subscription (SaaS)', 'Freemium', 'One-time purchase', 'Usage-based', 'Marketplace app'],
  },
  {
    id: 'model',
    message: "Last one — **do you have any relevant experience, domain expertise, or unfair advantages** in this space? (Optional but helps the Guardian calibrate)",
  },
  {
    id: 'expertise',
    message: "Perfect. **What's your email?** We'll send your validation results there. (Required for Guardian debate results — they take 5-7 minutes to run.)",
  },
  {
    id: 'email',
    message: '', // Terminal step — summary generated in code
  },
];

const MODEL_MAP: Record<string, string> = {
  'Subscription (SaaS)': 'subscription',
  'Freemium': 'freemium',
  'One-time purchase': 'one_time',
  'Usage-based': 'usage_based',
  'Marketplace app': 'marketplace_app',
};

export default function ChatIntake() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: FLOW_STEPS[0].message },
  ]);
  const [input, setInput] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isComplete) inputRef.current?.focus();
  }, [stepIndex, isComplete]);

  function handleSend(text?: string) {
    const userText = text || input.trim();
    if (!userText) return;

    const currentStep = FLOW_STEPS[stepIndex];
    const newAnswers = { ...answers, [currentStep.id]: userText };
    setAnswers(newAnswers);

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: userText },
    ];

    const nextIdx = stepIndex + 1;

    if (nextIdx >= FLOW_STEPS.length) {
      // All questions answered — show summary
      const summary = buildSummary(newAnswers);
      newMessages.push({
        role: 'assistant',
        text: summary,
      });
      setMessages(newMessages);
      setIsComplete(true);
      setInput('');
      return;
    }

    const nextStep = FLOW_STEPS[nextIdx];
    if (nextStep.message) {
      newMessages.push({
        role: 'assistant',
        text: nextStep.message,
        options: nextStep.options,
      });
    }

    setMessages(newMessages);
    setStepIndex(nextIdx);
    setInput('');
  }

  function buildSummary(a: Record<string, string>): string {
    return `Great, here's what I've captured:\n\n**Problem:** ${a.problem || a.greeting}\n**Audience:** ${a.audience || a.problem}\n**Current solutions:** ${a.existing || 'None mentioned'}\n**Your solution:** ${a.solution}\n**Differentiator:** ${a.differentiation}\n**Revenue model:** ${a.model}\n${a.expertise ? `**Your edge:** ${a.expertise}` : ''}\n**Results to:** ${a.email}\n\nReady to submit this to the Guardian? 👇`;
  }

  function buildIdeaText(a: Record<string, string>): string {
    const parts = [];
    if (a.greeting) parts.push(a.greeting);
    if (a.solution) parts.push(`Solution: ${a.solution}`);
    if (a.existing) parts.push(`Current alternatives: ${a.existing}`);
    if (a.differentiation) parts.push(`Differentiator: ${a.differentiation}`);
    if (a.expertise) parts.push(`Founder advantage: ${a.expertise}`);
    return parts.join('. ');
  }

  async function handleSubmitToGuardian() {
    setIsSubmitting(true);
    const ideaText = buildIdeaText(answers);
    const audience = answers.audience || answers.problem || '';
    const model = MODEL_MAP[answers.model] || 'subscription';
    const email = answers.email || '';

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaText, audience, model }),
      });
      const data = await res.json();
      
      // Show results inline
      const score = data.score ?? data.confidence ?? '?';
      const verdict = data.guardianDebate?.verdict || (score >= 70 ? 'Promising' : score >= 40 ? 'Needs work' : 'High risk');
      
      const resultMsg = `## Results: ${score}% — ${verdict}\n\n${
        data.risks?.length ? `**Risks identified:**\n${data.risks.map((r: any) => `• ${typeof r === 'string' ? r : r.risk || r.pattern || JSON.stringify(r)}`).join('\n')}` : ''
      }\n\n${
        data.strengths?.length ? `**Strengths:**\n${data.strengths.map((s: any) => `• ${typeof s === 'string' ? s : s.strength || JSON.stringify(s)}`).join('\n')}` : ''
      }\n\n${
        data.guardianDebate?.status === 'running' 
          ? `⚔️ **Full Guardian debate is running** — results will be emailed to ${email} in 5-7 minutes.`
          : data.guardianDebate?.status === 'error'
          ? '⚠️ Guardian debate service unavailable right now. Your instant results are shown above.'
          : '💡 Upgrade to Pro for a full adversarial Guardian debate with detailed transcript.'
      }\n\n[View full results →](/?prefill=chat)`;

      setMessages(prev => [...prev, { role: 'assistant', text: resultMsg }]);
      
      // Also store for the main page if they want to see more
      sessionStorage.setItem('vaas_prefill', JSON.stringify({ idea: ideaText, audience, model }));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Something went wrong submitting your idea. Please try again or use the [main form](/) directly.' }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">VaaS</span>
          <span className="text-xs text-gray-500">by Greenbelt</span>
        </a>
        <div className="text-sm text-gray-500">
          💬 Guided Intake
        </div>
      </nav>

      {/* Chat area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 overflow-y-auto pb-40">
        <div className="py-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-600/20 border border-green-500/30 text-green-100'
                  : 'bg-gray-800/60 border border-gray-700/50 text-gray-200'
              }`}
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>') }}
              />
            </div>
          ))}

          {/* Option buttons */}
          {!isComplete && FLOW_STEPS[stepIndex]?.options && (
            <div className="flex flex-wrap gap-2 pl-2">
              {FLOW_STEPS[stepIndex].options!.map(opt => (
                <button key={opt} onClick={() => handleSend(opt)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/50 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm transition-all">
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Submit button when complete */}
          {isComplete && (
            <div className="flex gap-3 pl-2">
              <button onClick={handleSubmitToGuardian} disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-xl transition-all disabled:opacity-50">
                {isSubmitting ? 'Preparing...' : '⚔️ Submit to Guardian'}
              </button>
              <button onClick={() => { setMessages([{ role: 'assistant', text: FLOW_STEPS[0].message }]); setStepIndex(0); setAnswers({}); setIsComplete(false); }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 py-3 px-6 rounded-xl transition-all border border-gray-700">
                Start Over
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar — fixed at bottom */}
      {!isComplete && !FLOW_STEPS[stepIndex]?.options && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-gray-800/50 py-4 px-6">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
            <button onClick={() => handleSend()} disabled={!input.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:text-gray-500">
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
