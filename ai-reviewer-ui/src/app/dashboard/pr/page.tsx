"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  GitPullRequest, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { mockPullRequests } from "@/lib/mock-data";

export default function PullRequestsPage() {
  const [search, setSearch] = useState("");

  const filteredPrs = mockPullRequests.filter(pr => 
    pr.title.toLowerCase().includes(search.toLowerCase()) ||
    pr.author.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pull Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor AI automated reviews across your repositories.</p>
        </div>
        <Button className="bg-primary neon-purple">
          <Plus className="w-4 h-4 mr-2" />
          Connect Repository
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter by title, author, or branch..." 
            className="pl-10 glass border-white/5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="glass border-white/5 h-10 gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPrs.map((pr) => (
          <Card key={pr.id} className="glass border-white/5 group hover:border-primary/20 transition-all duration-300">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-white/10 uppercase bg-white/5">
                    #{pr.number}
                  </Badge>
                  <Link href="/dashboard/review" className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                    {pr.title}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-white/10">
                      <AvatarImage src={pr.author.avatar} />
                      <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{pr.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{pr.author.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="font-mono">{pr.branch.head}</span>
                    <span className="opacity-50">into</span>
                    <span className="font-mono">{pr.branch.base}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Opened {new Date(pr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-6 mr-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Status</p>
                    <StatusBadge status={pr.status} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Files</p>
                    <span className="text-sm font-bold">{pr.files.length}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Comments</p>
                    <div className="flex items-center justify-center gap-1 text-sm font-bold">
                      <MessageSquare className="w-3 h-3 text-primary" />
                      {pr.comments.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/dashboard/review">
                    <Button variant="outline" size="sm" className="h-9 border-white/10 hover:bg-primary/10 hover:text-primary transition-all">
                      View Review
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong">
                      <DropdownMenuItem className="cursor-pointer">Re-run AI Scan</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Mark as Critical</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Assign Reviewer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
    <Badge variant="outline" className={`${styles[status] || styles.pending} px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border-none`}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
