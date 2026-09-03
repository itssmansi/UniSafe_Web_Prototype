import React, { useState, useEffect } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "../components/kb";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { complaintService } from "../services/complaintService";

const columns = [
  { id: "planned", name: "Planned", color: "#A1A1AA" }, // zinc-400
  { id: "in_progress", name: "In Progress", color: "#F59E0B" }, // amber-500
  { id: "done", name: "Done", color: "#10B981" }, // emerald-500
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export default function KanbanPage({ onBack }) {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      const formatted = data.map(c => ({
        id: c.id,
        name: c.title,
        column: c.status === 'in_review' ? 'done' : c.status,
        startAt: new Date(c.start_date || c.created_at),
        endAt: new Date(c.end_date || Date.now()),
        owner: c.owner
      }));
      setFeatures(formatted);
    });
    return unsubscribe;
  }, []);

  const handleDataChange = (newData) => {
    const changedItem = newData.find(item => {
      const oldItem = features.find(f => f.id === item.id);
      return oldItem && oldItem.column !== item.column;
    });
    setFeatures(newData);
    if (changedItem) {
      complaintService.updateComplaintStatus(changedItem.id, changedItem.column);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 flex flex-col font-sans overflow-hidden text-zinc-100 selection:bg-zinc-800">
      {/* App Bar */}
      <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex items-center shadow-sm z-10 flex-shrink-0">
        <button onClick={onBack} className="mr-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white">Issue Board</h1>
        
        <div className="ml-auto flex items-center gap-3">
          <div className="flex -space-x-2">
            {/* Fake active team members for flair */}
            <Avatar className="h-7 w-7 border-2 border-zinc-900 ring-0"><AvatarImage src="https://i.pravatar.cc/100?img=33" /></Avatar>
            <Avatar className="h-7 w-7 border-2 border-zinc-900 ring-0"><AvatarImage src="https://i.pravatar.cc/100?img=47" /></Avatar>
            <Avatar className="h-7 w-7 border-2 border-zinc-900 ring-0"><AvatarImage src="https://i.pravatar.cc/100?img=12" /></Avatar>
          </div>
          <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-md transition-colors border border-zinc-700">
            Share
          </button>
        </div>
      </header>

      {/* Board Area */}
      <div className="flex-1 overflow-hidden p-8">
        <KanbanProvider
          columns={columns}
          data={features}
          onDataChange={handleDataChange}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                    style={{ backgroundColor: column.color, boxShadow: `0 0 8px ${column.color}80` }}
                  />
                  <span className="font-semibold tracking-wide text-zinc-200">{column.name}</span>
                </div>
                <div className="text-xs font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700/50">
                  {features.filter(f => f.column === column.id).length}
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(feature) => (
                  <KanbanCard
                    column={column.id}
                    id={feature.id}
                    key={feature.id}
                    name={feature.name}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="m-0 font-medium text-[14px] leading-snug text-zinc-100 group-hover:text-white">
                        {feature.name}
                      </p>
                      {feature.owner && (
                        <Avatar className="h-7 w-7 shrink-0 border border-zinc-700/80 shadow-sm">
                          <AvatarImage src={feature.owner.image} />
                          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                            {feature.owner.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-300">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] font-medium tracking-wide">
                          {shortDateFormatter.format(feature.startAt)} - {dateFormatter.format(feature.endAt)}
                        </span>
                      </div>
                      
                      {/* Random flair tag based on category if needed, here we'll just put an ID */}
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                        #{feature.id.toString().slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
