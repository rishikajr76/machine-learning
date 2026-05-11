"use client";

import { useState } from "react";
import { 
  Settings, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Layers, 
  MessageSquare, 
  Save, 
  Bell, 
  Shield, 
  Github, 
  Key,
  Smartphone,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { defaultSettings } from "@/lib/mock-data";

export default function SettingsPage() {
  const [activeSettings, setActiveSettings] = useState(defaultSettings);

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1200px] mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your AI agents, models, and system behavior.</p>
        </div>
        <Button className="bg-primary neon-purple h-11 px-8 gap-2 font-bold group">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Rail */}
        <div className="lg:col-span-1 space-y-2">
           <SettingsNavItem icon={Cpu} label="Agent Configuration" active />
           <SettingsNavItem icon={Github} label="Integrations" />
           <SettingsNavItem icon={Bell} label="Notifications" />
           <SettingsNavItem icon={Shield} label="Security" />
           <SettingsNavItem icon={Key} label="API Keys" />
           <SettingsNavItem icon={Smartphone} label="Preferences" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Agent Configuration */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4">Agent Configuration</h2>
            
            <Tabs defaultValue="proposer" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/5 h-12 p-1 gap-1">
                <TabsTrigger value="proposer" className="flex-1 rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest">Proposer</TabsTrigger>
                <TabsTrigger value="critic" className="flex-1 rounded-md data-[state=active]:bg-accent/20 data-[state=active]:text-accent font-bold text-xs uppercase tracking-widest">Critic</TabsTrigger>
                <TabsTrigger value="evaluator" className="flex-1 rounded-md data-[state=active]:bg-white/10 font-bold text-xs uppercase tracking-widest">Evaluator</TabsTrigger>
              </TabsList>

              <TabsContent value="proposer" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Primary Reasoning Model</Label>
                      <Select defaultValue={activeSettings.proposer.model}>
                        <SelectTrigger className="glass border-white/10 h-11">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent className="glass-strong">
                          <SelectItem value="gpt-4o">GPT-4o (Reasoning Optimized)</SelectItem>
                          <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="deepseek-coder">DeepSeek Coder V2</SelectItem>
                          <SelectItem value="codellama">CodeLlama (Local)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
                        <Info className="w-3 h-3" />
                        Recommended for complex logic and structural changes.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Creativity (Temperature)</Label>
                        <span className="text-xs font-mono font-bold text-primary">{activeSettings.proposer.temperature}</span>
                      </div>
                      <Slider defaultValue={[activeSettings.proposer.temperature]} max={1} step={0.1} className="py-4" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Max Iteration Depth</Label>
                      <Select defaultValue={activeSettings.proposer.loopDepth.toString()}>
                        <SelectTrigger className="glass border-white/10 h-11">
                          <SelectValue placeholder="Select depth" />
                        </SelectTrigger>
                        <SelectContent className="glass-strong">
                          <SelectItem value="1">1 (Single Pass)</SelectItem>
                          <SelectItem value="3">3 (Recommended)</SelectItem>
                          <SelectItem value="5">5 (Deep Analysis)</SelectItem>
                          <SelectItem value="10">10 (Extreme Refinement)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-4">
                      <Zap className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold mb-1">Cost Optimization</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Deeper loops provide better accuracy but increase token usage. We recommend a depth of 3 for production repos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="critic" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Critic Aggressiveness</Label>
                        <span className="text-xs font-mono font-bold text-accent">{activeSettings.critic.criticAggressiveness}/10</span>
                      </div>
                      <Slider defaultValue={[activeSettings.critic.criticAggressiveness]} max={10} step={1} className="py-4" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Adversarial Fuzzing</Label>
                        <p className="text-[10px] text-muted-foreground">Force agent to simulate inputs for edge-case hunting.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <Card className="glass border-accent/20 bg-accent/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs font-bold flex items-center gap-2 text-accent uppercase tracking-widest">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Security Protocol
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-[11px] leading-relaxed opacity-80">
                            When set to 9+ aggressiveness, the Critic will automatically run static analysis tools (SonarQube) 
                            and cross-reference against the CVE database.
                          </p>
                        </CardContent>
                     </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* System Global Settings */}
          <section className="space-y-6 pt-6">
            <h2 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4">Global Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/30">
                  <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-white/5">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                     </div>
                     <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Real-time Streaming</Label>
                        <p className="text-[10px] text-muted-foreground">Animate AI reasoning logs as they generate.</p>
                     </div>
                  </div>
                  <Switch defaultChecked={activeSettings.streamingEnabled} />
               </div>

               <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/30">
                  <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-white/5">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                     </div>
                     <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Auto-Refinement</Label>
                        <p className="text-[10px] text-muted-foreground">Automatically trigger v2 if Critic confidence is &lt; 70%.</p>
                     </div>
                  </div>
                  <Switch defaultChecked={activeSettings.autoRefine} />
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ icon: Icon, label, active = false }: any) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
      active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
    }`}>
      <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      <ChevronRight className={`w-4 h-4 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    </button>
  );
}
