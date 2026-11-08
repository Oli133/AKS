import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Terminal, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
}

export const KernelCopilotChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `Hello! I am your Android Kernel Copilot. Ask me anything about cross-compiling Android kernels, resolving Kbuild/LLD linker errors, GKI 2.0 KMI requirements, AnyKernel3 zip packaging, or device trees.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const presetQuestions = [
    'How do I unpack and repack vendor_boot with magiskboot?',
    'What causes "ld.lld: error: undefined symbol" in GKI kernels?',
    'How do I integrate KernelSU and SuSFS into a 5.15 kernel?',
    'What are the exact build commands for Google Pixel 8 (Tensor G3)?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/kernel/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });
      const data = await res.json();

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: data.answer || 'No response received from kernel copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, copilotMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'copilot',
          text: `In Android kernel development, building an upstream or OEM kernel requires three main pieces:\n\n1. **Kernel Source Tree & Device Tree**: Sourced from Google android-kernel or OEM repo.\n2. **Clang / LLVM Cross-Compiler**: Modern Android uses prebuilt Google Clang (r487747c or newer) with ARCH=arm64 and LLVM=1 LLVM_IAS=1.\n3. **Packaging / Flashing**: AnyKernel3 flashable zip via recovery or fastboot flash boot boot.img.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col h-[600px]">
      {/* Top Header */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Kernel Engineering Copilot</h3>
            <span className="text-[11px] text-slate-400 font-mono">Specialized in Linux ARM64 & Android AOSP Architecture</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                  isUser
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                  isUser
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap font-mono'
                }`}
              >
                {msg.text}
                <div className="text-[10px] text-slate-500 mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs italic pl-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Consulting kernel tree & Kconfig symbols...</span>
          </div>
        )}
      </div>

      {/* Preset Suggestions */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-500 font-mono shrink-0">Ask:</span>
        {presetQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 whitespace-nowrap transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a technical question about Android kernel compilation, defconfig, or drivers..."
          className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
};
