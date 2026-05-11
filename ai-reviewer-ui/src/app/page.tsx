"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  GitBranch, 
  Terminal as TerminalIcon,
  Search,
  Code2,
  BrainCircuit,
  Layers,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 border-b border-white/5 backdrop-blur-sm bg-background/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary neon-purple flex items-center justify-center">
            <TerminalIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl tracking-tighter gradient-text">Aegis AI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          <Link href="#architecture" className="hover:text-primary transition-colors">Architecture</Link>
          <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">Demo</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="hidden sm:inline-flex text-sm">Sign In</Button>
          </Link>
          <Link href="/dashboard/review">
            <Button className="rounded-full px-6 h-10 bg-primary hover:bg-primary/90 neon-purple text-sm font-bold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">New: Multi-Agent Reasoning Loop</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
        >
          AI-Powered <br />
          <span className="gradient-text">Self-Correcting</span> <br />
          Code Reviews
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
        >
          Beyond simple linting. A multi-agent AI loop that reasons through complex bugs, 
          critiques its own fixes, and refines code to production-grade quality automatically.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/dashboard/review">
            <Button className="w-full sm:w-auto rounded-full h-14 px-10 text-base font-bold bg-primary neon-purple group">
              Try Interactive Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#architecture">
            <Button variant="outline" className="w-full sm:w-auto rounded-full h-14 px-10 text-base font-bold border-white/10 glass-strong">
              View Architecture
            </Button>
          </Link>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-24 w-full max-w-5xl relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary-foreground opacity-20 blur-2xl rounded-[2rem]" />
          <div className="relative border border-white/10 rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-3xl shadow-2xl">
            <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-6 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="ml-4 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-md border border-white/5">
                <TerminalIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-mono text-muted-foreground">review_agent.sh --mode adversarial</span>
              </div>
            </div>
            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Proposer Agent</h4>
                    <p className="text-xs text-muted-foreground">Analyzing code for vulnerabilities...</p>
                  </div>
                </div>
                <div className="pl-5 border-l-2 border-primary/20 space-y-4">
                  <div className="text-[13px] font-mono p-4 rounded-lg bg-black/40 border border-white/5 text-primary-foreground/90 animate-stream-in">
                    <span className="text-primary opacity-70">Obs:</span> Unhandled JWT exception found at line 24. <br />
                    <span className="text-primary opacity-70">Hyp:</span> Potential crash on malformed token. <br />
                    <span className="text-primary opacity-70">Action:</span> Drafting try-catch patch with validation...
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent border border-accent/30">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Critic Agent</h4>
                    <p className="text-xs text-muted-foreground">Running adversarial edge-case simulation...</p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square md:aspect-video rounded-xl bg-black/40 border border-white/5 p-6 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live Reasoning Loop</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-75" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 h-auto rounded-full bg-gradient-to-b from-primary to-transparent" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-24 bg-white/10 rounded" />
                        <div className="h-2 w-full bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-4 flex justify-end">
                   <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold">
                     ITERATION 2: APPROVED BY EVALUATOR
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 md:px-12 bg-white/[0.01] relative border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Enterprise Grade Reliability</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system replaces static analysis with dynamic reasoning. No more false positives, just actionable patches.
            </p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Cpu, 
                title: "Chain-of-Thought", 
                desc: "Agents don't just fix code; they write out their reasoning, hypotheses, and plans before making any changes." 
              },
              { 
                icon: ShieldCheck, 
                title: "Adversarial Critique", 
                desc: "Every suggested fix is put through a rigorous edge-case hunt by an independent 'Hunter' agent to find flaws." 
              },
              { 
                icon: Zap, 
                title: "Real-time Refinement", 
                desc: "Our loops continue until the Evaluator agent is satisfied with the patch confidence and security scores." 
              },
              { 
                icon: Layers, 
                title: "Vector Memory", 
                desc: "The system learns from your codebase's history, storing past fixes to avoid repeating mistakes." 
              },
              { 
                icon: GitBranch, 
                title: "CI/CD Native", 
                desc: "Fully integrates into GitHub, GitLab, and Bitbucket as an automated quality gatekeeper." 
              },
              { 
                icon: Code2, 
                title: "Context Injection", 
                desc: "Agents see the whole project tree, not just snippets, allowing for deep architectural awareness." 
              },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={item}
                className="p-8 rounded-3xl border border-white/5 bg-card/50 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-bold mb-8 relative z-10">Stop Merging Bugs.</h2>
          <p className="text-lg text-primary-foreground/70 mb-12 relative z-10">
            Join 200+ engineering teams using Aegis AI to automate their senior-level code reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/dashboard/review">
              <Button className="h-14 px-10 rounded-full bg-white text-black hover:bg-white/90 font-bold text-lg">
                Get Started for Free
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-10 rounded-full border-white/20 glass-strong font-bold text-lg">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5 text-center text-muted-foreground text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-8">
          <div className="flex items-center gap-3 grayscale opacity-70">
             <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
               <TerminalIcon className="w-4 h-4 text-primary-foreground" />
             </div>
             <span className="font-bold tracking-tighter">Aegis AI</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-primary transition-colors">API</Link>
            <Link href="#" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
          <div>
            © 2026 Aegis AI Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
