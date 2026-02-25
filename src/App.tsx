/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { transformTranscript } from './services/geminiService';

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const result = await transformTranscript(transcript);
      setNotes(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTranscript('');
    setNotes('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-black font-serif selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-300 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-800 rounded flex items-center justify-center text-white">
              <FileText size={16} />
            </div>
            <h1 className="text-lg font-bold tracking-tight font-sans">CrystalNotes</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleClear}
              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded transition-colors"
              title="Clear all"
            >
              <Trash2 size={18} />
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 font-sans"
            >
              <Info size={14} />
              Billing
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-72px)]">
        {/* Input Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between font-sans">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <FileText size={14} />
              Transcript
            </h2>
            <span className="text-xs text-zinc-400">
              {transcript.length} chars
            </span>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste transcript here..."
              className="w-full h-full p-6 bg-white border border-zinc-300 shadow-sm focus:outline-none focus:border-zinc-500 transition-all resize-none font-sans text-base leading-relaxed"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || !transcript.trim()}
            className={`
              w-full py-3 font-bold flex items-center justify-center gap-2 transition-all font-sans
              ${isProcessing || !transcript.trim() 
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' 
                : 'bg-zinc-900 text-white hover:bg-black active:scale-[0.99]'}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                Generate Crystal Notes
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </section>

        {/* Output Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between font-sans">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Sparkles size={14} />
              Notes
            </h2>
            {notes && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100 px-3 py-1.5 border border-zinc-300 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 bg-white border border-zinc-300 shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-10 prose prose-zinc max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6 text-red-600 font-sans"
                  >
                    <Info size={24} className="mb-2" />
                    <p className="font-bold">{error}</p>
                  </motion.div>
                ) : notes ? (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="markdown-body"
                  >
                    <Markdown rehypePlugins={[rehypeRaw]}>
                      {notes}
                    </Markdown>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-300 font-sans"
                  >
                    <Sparkles size={40} className="mb-4 opacity-20" />
                    <p className="max-w-[200px] text-sm">
                      Structured notes will appear here.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        .font-serif {
          font-family: 'Libre Baskerville', serif;
        }

        .markdown-body {
          font-size: 15px;
          line-height: 1.5;
          color: black;
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          font-family: 'Libre Baskerville', serif;
        }

        .markdown-body ul {
          list-style-type: none;
          padding-left: 2.2em; /* Consistent deep indentation */
          margin-top: 0.2em;
        }

        .markdown-body li {
          position: relative;
          margin-bottom: 0.1em;
        }

        .markdown-body li::before {
          content: "-";
          position: absolute;
          left: -1.2em;
          color: black;
        }

        .markdown-body u {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .markdown-body strong {
          color: black;
        }

        /* Ensure deep nesting doesn't lose indentation */
        .markdown-body ul ul ul ul ul ul {
          padding-left: 2.2em;
        }
      `}</style>
    </div>
  );
}
