"use client";

import { motion } from "framer-motion";
import { 
  Activity, 
  Bug, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockMetrics, mockPullRequests } from "@/lib/mock-data";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardOverview() {
  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time performance metrics and review status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1 text-xs font-bold">
            All Systems Operational
          </Badge>
          <Button size="sm" className="bg-primary neon-purple">
            <Activity className="w-4 h-4 mr-2" />
            Live Monitor
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Total Reviews" 
          value={mockMetrics.totalReviews.toLocaleString()} 
          change="+12.5%" 
          trend="up"
          icon={CheckCircle2}
          color="text-primary"
        />
        <StatCard 
          title="Bugs Detected" 
          value={mockMetrics.bugsDetected.toLocaleString()} 
          change="+8.2%" 
          trend="up"
          icon={Bug}
          color="text-accent"
        />
        <StatCard 
          title="Avg. Loops" 
          value={mockMetrics.avgRefinementLoops.toFixed(1)} 
          change="-0.4" 
          trend="down"
          icon={Clock}
          color="text-yellow-500"
        />
        <StatCard 
          title="Critical Vulnerabilities" 
          value={mockMetrics.criticalVulnerabilitiesPrevented.toString()} 
          change="+14" 
          trend="up"
          icon={ShieldAlert}
          color="text-destructive"
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-lg font-bold">Review Activity</CardTitle>
              <CardDescription>Daily volume of code reviews and successful fixes.</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">7 DAY VIEW</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMetrics.reviewActivity}>
                  <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.28 290)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.65 0.28 290)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFixes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.2 195)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.75 0.2 195)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.12 0.015 265)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke="oklch(0.65 0.28 290)" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fixes" 
                    stroke="oklch(0.75 0.2 195)" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Bug Distribution</CardTitle>
            <CardDescription>Most common categories detected.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockMetrics.bugCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {mockMetrics.bugCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.12 0.015 265)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {mockMetrics.bugCategories.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pull Requests */}
        <Card className="lg:col-span-2 glass border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Live Reviews</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5">
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    <th className="px-6 py-4">Pull Request</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Last Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mockPullRequests.map((pr) => (
                    <tr key={pr.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">
                            {pr.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">#{pr.number} • {pr.branch.head}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold border border-primary/30">
                            {pr.author.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs">{pr.author.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pr.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {new Date(pr.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Agent Performance</CardTitle>
            <CardDescription>Efficiency and accuracy scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mockMetrics.agentPerformance.map((agent, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{agent.agent} Agent</span>
                  <span className="text-primary">{agent.accuracy}% Accuracy</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.accuracy}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                    className="h-full bg-primary rounded-full neon-purple" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold pt-1">
                   <span>Confidence: {agent.confidence}</span>
                   <span>Speed: {agent.speed}/100</span>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold">Insight: Success rate up 4.2%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Switching Proposer to GPT-4o has reduced iteration counts by 1.2 per review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  return (
    <Card className="glass border-border/50 group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <Badge variant="outline" className={trend === 'up' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-primary border-primary/20 bg-primary/10'}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-accent/10 text-accent border-accent/20",
    needs_refinement: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest`}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
