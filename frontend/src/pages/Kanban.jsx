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
  { id: "planned", name: "Planned", color: "#6B7280" },
  { id: "in_progress", name: "In Progress", color: "#F59E0B" },
  { id: "done", name: "Done", color: "#10B981" },
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
    <div className="min-h-screen bg-[#0d0d0e] p-8 font-sans text-white">
      {/* Top minimal bar to allow navigation */}
      <div className="mb-6 flex items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white bg-[#1c1c1e] hover:bg-[#26262a] border border-[#2a2a2e] px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>

      {/* Kanban Board matching exact reference */}
      <KanbanProvider
        columns={columns}
        data={features}
        onDataChange={handleDataChange}
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="font-semibold text-sm text-white">{column.name}</span>
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="m-0 flex-1 font-medium text-sm text-white">
                        {feature.name}
                      </p>
                    </div>
                    {feature.owner && (
                      <Avatar className="h-5 w-5 shrink-0 rounded-full overflow-hidden border border-[#2e2e32]">
                        <AvatarImage src={feature.owner.image} />
                        <AvatarFallback>
                          {feature.owner.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <p className="m-0 text-[#88888e] text-xs mt-2 font-normal">
                    {shortDateFormatter.format(feature.startAt)} -{" "}
                    {dateFormatter.format(feature.endAt)}
                  </p>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
