"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  GitBranch, 
  FileCode2, 
  BrainCircuit, 
  Search, 
  CheckSquare,
  History,
  Terminal,
  Download,
  Share2,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentReasoning } from "@/components/agent-reasoning";
import { useReviewStore } from "@/store/useReviewStore";
import { mockReview } from "@/lib/mock-data";

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState("proposer");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const { activeReview, setActiveReview, isAnalyzing, setAnalyzing, handleWSEvent } = useReviewStore();
  const [code, setCode] = useState(mockReview.files[0].content);

  useEffect(() => {
    // Initial setup with mock or last review
    if (!activeReview) {
      setActiveReview(mockReview);
    }
  }, [activeReview, setActiveReview]);

  if (!activeReview) return null;

  const handleRunReview = async () => {
    if (isAnalyzing) return;
    
    setAnalyzing(true);
    try {
      const { apiService } = await import("@/services/api");
      const { wsService } = await import("@/services/websocket");

      // 1. Create/Start review record
      const review = await apiService.startReview({
        files: [{ path: "auth-service.ts", language: "typescript", content: code }],
        context: "Adversarial security review requested."
      });

      setActiveReview(review);

      // 2. Connect WebSocket for live updates
      wsService.connect(review.id, (data) => {
        handleWSEvent(data);
        if (data.type === 'evaluate') {
          setAnalyzing(false);
          // Fetch final review state to get the full patch and scoring
          apiService.getReview(review.id).then(setActiveReview);
        }
      });

    } catch (err) {
      console.error("Failed to run review:", err);
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Review Toolbar */}
      <div className="h-14 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">{activeReview.id}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase">
            In Analysis
          </Badge>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="w-3.5 h-3.5" />
            <span>Last refined 2m ago</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-xs gap-2">
            <Share2 className="w-3.5 h-3.5" />
            Export
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button 
            onClick={handleRunReview}
            disabled={isAnalyzing}
            className="bg-primary neon-purple hover:bg-primary/90 h-9 px-4 text-xs font-bold gap-2"
          >
            {isAnalyzing ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {isAnalyzing ? "Analyzing..." : "Re-Run Review"}
          </Button>
          <Button className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 h-9 px-4 text-xs font-bold gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Approve & Merge
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Explorer & Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          <div className="flex-1 flex overflow-hidden">
            {/* Minimal Explorer */}
            <div className="w-12 border-r border-white/5 bg-black/20 flex flex-col items-center py-4 gap-6 shrink-0">
              <FileCode2 className="w-5 h-5 text-primary" />
              <Search className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <History className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Terminal className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
              <div className="h-9 border-b border-white/5 bg-white/5 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary">auth-service.ts</span>
                  <Badge variant="outline" className="text-[9px] h-4 py-0 border-destructive/30 text-destructive bg-destructive/5">
                    2 CRITICAL ISSUES
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-mono text-muted-foreground uppercase">TypeScript</span>
                   <Maximize2 className="w-3 h-3 text-muted-foreground cursor-pointer" />
                </div>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  theme={editorTheme}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono)",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 20 },
                    lineNumbersMinChars: 3,
                    glyphMargin: true,
                  }}
                  onMount={(editor) => {
                    // Inject markers for bugs
                    const markers = [
                      {
                        startLineNumber: 7,
                        startColumn: 1,
                        endLineNumber: 7,
                        endColumn: 100,
                        message: "Unhandled jwt.verify exception leaks stack trace",
                        severity: 8, // Error
                      }
                    ];
                    // @ts-ignore
                    window.monaco?.editor.setModelMarkers(editor.getModel(), "owner", markers);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Inline Patch Info (Bottom of Editor) */}
          <div className="h-1/4 border-t border-white/5 bg-background/50 p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Suggested Patch Context
              </h4>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-white/10 glass">
                <Download className="w-3 h-3 mr-2" />
                Download Diff
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Secure JWT Validation Pattern</p>
                      <p className="text-[10px] text-muted-foreground">Addresses unhandled exceptions and env-var nullability.</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-none">HIGH CONFIDENCE</Badge>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Sliding Expiry Logic</p>
                      <p className="text-[10px] text-muted-foreground">Sets explicit TTL for refreshed tokens.</p>
                    </div>
                  </div>
                  <Badge className="bg-accent/20 text-accent border-none">REFINED v2</Badge>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel: AI Reasoning Tabs */}
        <div className="w-[500px] flex flex-col bg-card/20 backdrop-blur-2xl shrink-0">
          <Tabs defaultValue="proposer" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-white/5 border-b border-white/5 rounded-none flex p-0">
              <TabsTrigger 
                value="proposer" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 text-[10px] uppercase tracking-widest font-bold"
              >
                Proposer
              </TabsTrigger>
              <TabsTrigger 
                value="critic" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 text-[10px] uppercase tracking-widest font-bold"
              >
                Critic
              </TabsTrigger>
              <TabsTrigger 
                value="evaluator" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-foreground data-[state=active]:bg-white/5 text-[10px] uppercase tracking-widest font-bold"
              >
                Evaluator
              </TabsTrigger>
              <TabsTrigger 
                value="patch" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-green-500/5 text-[10px] uppercase tracking-widest font-bold"
              >
                Final Patch
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <TabsContent value="proposer" className="h-full m-0 p-0 absolute inset-0">
                  <AgentReasoning 
                    agent={activeReview.proposer} 
                    title="Proposer" 
                    icon={BrainCircuit} 
                    color="text-primary" 
                  />
                </TabsContent>
                <TabsContent value="critic" className="h-full m-0 p-0 absolute inset-0">
                  <AgentReasoning 
                    agent={activeReview.critic} 
                    title="Critic" 
                    icon={Search} 
                    color="text-accent" 
                  />
                </TabsContent>
                <TabsContent value="evaluator" className="h-full m-0 p-0 absolute inset-0">
                  <AgentReasoning 
                    agent={activeReview.evaluator} 
                    title="Evaluator" 
                    icon={ShieldCheck} 
                    color="text-foreground" 
                  />
                </TabsContent>
                <TabsContent value="patch" className="h-full m-0 p-0 absolute inset-0 flex flex-col">
                  <div className="flex-1 flex flex-col bg-black/20">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                       <h3 className="text-sm font-bold">Suggested Fix</h3>
                       <Badge className="bg-green-500/20 text-green-500 border-none">VERIFIED</Badge>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={activeReview.finalPatch}
                        options={{
                          readOnly: true,
                          fontSize: 12,
                          fontFamily: "var(--font-geist-mono)",
                          minimap: { enabled: false },
                          automaticLayout: true,
                        }}
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                       <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-10">
                         Apply Patch to auth-service.ts
                       </Button>
                    </div>
                  </div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
