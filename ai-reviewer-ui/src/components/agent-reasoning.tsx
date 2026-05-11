"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  BrainCircuit, 
  AlertCircle,
  Code2,
  FileSearch,
  Zap,
  Target,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentResult, ReasoningStep } from "@/types";
import { cn } from "@/lib/utils";

interface AgentReasoningProps {
  agent: AgentResult;
  title: string;
  icon: any;
  color: string;
}

export function AgentReasoning({ agent, title, icon: Icon, color }: AgentReasoningProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Info */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-opacity-10 border border-opacity-20", color.replace('text-', 'bg-').replace('text-', 'border-'), color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{title} Agent</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 uppercase tracking-tighter">
                {agent.status === 'thinking' ? 'Analyzing...' : agent.status.toUpperCase()}
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Iteration {agent.iterationCount}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-primary">{agent.confidence}% Confidence</div>
          <div className="text-[10px] text-muted-foreground">{agent.durationMs}ms latency</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Thoughts Section */}
          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
              <BrainCircuit className="w-3 h-3" />
              Chain of Thought
            </h4>
            
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <ThoughtBlock label="Observation" content={agent.thoughts.observation} color={color} />
                <ThoughtBlock label="Hypothesis" content={agent.thoughts.hypothesis} color={color} />
                <ThoughtBlock label="Plan" content={agent.thoughts.plan} color={color} />
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Reasoning Steps Section */}
          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
              <TerminalIcon className="w-3 h-3" />
              Live Execution Logs
            </h4>
            
            <div className="space-y-3">
              {agent.reasoning.map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 group"
                >
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500",
                      idx === agent.reasoning.length - 1 && agent.status === 'thinking'
                        ? "border-primary bg-primary/20 animate-pulse"
                        : "border-border bg-white/5"
                    )}>
                      {idx === agent.reasoning.length - 1 && agent.status === 'thinking' ? (
                        <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                      )}
                    </div>
                    {idx < agent.reasoning.length - 1 && (
                      <div className="w-px flex-1 bg-border/30 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{step.label}</span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                      {step.content}
                      {idx === agent.reasoning.length - 1 && agent.status === 'thinking' && (
                        <span className="inline-block w-1 h-3 bg-primary ml-1 animate-typing-cursor" />
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Issues Detected (Specific to Critic) */}
          {agent.issues && agent.issues.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-destructive flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                Vulnerabilities Identified
              </h4>
              <div className="space-y-3">
                {agent.issues.map((issue) => (
                  <div key={issue.id} className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive" className="text-[9px] font-bold h-4">
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">LINE {issue.line}</span>
                    </div>
                    <p className="text-xs font-medium">{issue.message}</p>
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-destructive/10">
                      <span className="font-bold">SUGGESTION:</span> {issue.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verdict Section (Specific to Evaluator) */}
          {agent.verdict && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "p-6 rounded-2xl border-2 text-center space-y-3",
                agent.verdict === 'approve' 
                  ? "bg-green-500/10 border-green-500/30 text-green-500" 
                  : "bg-primary/10 border-primary/30 text-primary"
              )}
            >
              <div className="flex justify-center">
                {agent.verdict === 'approve' ? <CheckCircle2 className="w-10 h-10" /> : <Loader2 className="w-10 h-10 animate-spin" />}
              </div>
              <h4 className="text-xl font-bold tracking-tight">
                {agent.verdict === 'approve' ? 'VERDICT: APPROVED' : 'VERDICT: REFINE'}
              </h4>
              <p className="text-xs opacity-80 max-w-xs mx-auto leading-relaxed">
                {agent.verdict === 'approve' 
                  ? "The patch addresses all identified security concerns and handles every adversarial edge case successfully."
                  : "Additional refinement required. Patch does not fully address the race condition identified by the Critic."}
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ThoughtBlock({ label, content, color }: { label: string; content: string; color: string }) {
  const icons: any = {
    Observation: FileSearch,
    Hypothesis: Target,
    Plan: Code2,
  };
  const Icon = icons[label] || BrainCircuit;

  return (
    <div className="group space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className={cn("text-[11px] font-bold uppercase tracking-wider opacity-60", color)}>{label}</span>
      </div>
      <div className="relative pl-3 border-l border-white/10 group-hover:border-primary/30 transition-colors">
        <p className="text-[13px] text-foreground/90 leading-relaxed italic font-serif">
          "{content}"
        </p>
      </div>
    </div>
  );
}

function TerminalIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function ShieldAlert(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
