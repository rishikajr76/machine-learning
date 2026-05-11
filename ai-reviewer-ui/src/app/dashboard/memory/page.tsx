"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Search, 
  History, 
  Terminal, 
  Tag, 
  Code2, 
  ShieldAlert,
  ArrowRight,
  Database,
  BarChart4
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { mockMemoryEntries } from "@/lib/mock-data";
import { MemoryEntry } from "@/types";

// Generate mock vector data for the visualization
const vectorData = Array.from({ length: 40 }).map((_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  z: Math.random() * 10,
  id: i,
  label: mockMemoryEntries[i % mockMemoryEntries.length].title,
  color: mockMemoryEntries[i % mockMemoryEntries.length].tags.includes('security') 
    ? 'oklch(0.65 0.22 25)' 
    : 'oklch(0.65 0.28 290)'
}));

export default function MemoryPage() {
  const [search, setSearch] = useState("");
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>(mockMemoryEntries);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { apiService } = await import("@/services/api");
      const res = await apiService.getMemoryCount().catch(() => ({ count: 1200 }));
      setCount(res.count);
    };
    fetchCount();
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) {
      setMemoryEntries(mockMemoryEntries);
      return;
    }
    
    setLoading(true);
    try {
      const { apiService } = await import("@/services/api");
      const results = await apiService.searchMemory(search);
      setMemoryEntries(results.length > 0 ? results : []);
    } catch (err) {
      console.error("Memory search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemory = memoryEntries;

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Memory</h1>
          <p className="text-muted-foreground mt-1">Semantic knowledge base of past reviews and bug patterns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1">
            <Database className="w-3 h-3 mr-2" />
            {count.toLocaleString()} Vectors Stored
          </Badge>
          <Button size="sm" variant="outline" className="glass border-white/5">
            <BarChart4 className="w-4 h-4 mr-2" />
            Embeddings Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search & Patterns */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Semantic search for bug patterns (e.g. 'unhandled async errors in express')..." 
                  className="pl-12 h-14 rounded-2xl glass border-white/10 text-base focus-visible:ring-primary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="h-14 px-8 rounded-2xl bg-primary neon-purple font-bold"
              >
                {loading ? "Searching..." : "Search Knowledge"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMemory.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass border-white/5 hover:border-primary/20 transition-all group h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <Badge variant="ghost" className="text-[10px] font-mono text-muted-foreground">
                        USED {entry.usageCount}x
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{entry.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{entry.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-destructive/80 italic">
                        <p className="mb-1 opacity-50 uppercase tracking-tighter font-bold">Bug Pattern:</p>
                        {entry.bugPattern}
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 font-mono text-[10px] text-green-500/90">
                        <p className="mb-1 opacity-50 uppercase tracking-tighter font-bold">Verified Fix:</p>
                        {entry.fix}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {entry.tags.map(tag => (
                          <Badge key={tag} className="text-[9px] bg-white/5 hover:bg-primary/20 border-none">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold group-hover:bg-primary/10">
                        VIEW FULL CASE
                        <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Visualization & Insights */}
        <div className="space-y-8">
          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                Knowledge Graph
              </CardTitle>
              <CardDescription className="text-xs">
                Clusters of semantically related issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <XAxis type="number" dataKey="x" hide />
                    <YAxis type="number" dataKey="y" hide />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'oklch(0.12 0.015 265)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }}
                      itemStyle={{ fontSize: '10px', color: '#fff' }}
                      labelFormatter={() => ''}
                    />
                    <Scatter name="Issues" data={vectorData}>
                      {vectorData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="animate-pulse" 
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                   <span className="text-[10px] uppercase font-bold text-muted-foreground">Logic/Performance</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-destructive" />
                   <span className="text-[10px] uppercase font-bold text-muted-foreground">Security Risks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Recent Learnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: "2h ago", text: "Identified new race condition pattern in Redis locks." },
                { time: "5h ago", text: "Refined JWT validation pattern to include HS256 algorithm check." },
                { time: "1d ago", text: "Added context for Next.js 15 App Router server actions." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                   <div className="w-1 h-auto rounded-full bg-primary/20" />
                   <div>
                     <p className="text-xs font-medium leading-relaxed">{item.text}</p>
                     <span className="text-[10px] text-muted-foreground">{item.time}</span>
                   </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 glass border-white/10 text-xs">View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
