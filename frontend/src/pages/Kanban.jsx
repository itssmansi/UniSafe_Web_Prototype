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
        column: c.status === 'in_review' ? 'done' : c.status, // Map 'in_review' to 'done' since the screenshot only has 3 columns
        startAt: new Date(c.start_date || c.created_at),
        endAt: new Date(c.end_date || Date.now()),
        owner: c.owner
      }));
      setFeatures(formatted);
    });
    return unsubscribe;
  }, []);

  const handleDataChange = (newData) => {
    // Find which item changed columns by comparing with current features state
    const changedItem = newData.find(item => {
      const oldItem = features.find(f => f.id === item.id);
      return oldItem && oldItem.column !== item.column;
    });

    // Update local state for immediate feedback
    setFeatures(newData);

    // Persist to database
    if (changedItem) {
      complaintService.updateComplaintStatus(changedItem.id, changedItem.column);
    }
  };

  return (
    <div className="h-screen bg-[#0E0E0E] flex flex-col font-sans overflow-hidden text-white">
      {/* App Bar */}
      <header className="bg-[#191919] border-b border-[#2A2A2A] px-4 py-3 flex items-center shadow-sm z-10 flex-shrink-0">
        <button onClick={onBack} className="mr-4 p-1 rounded hover:bg-[#2A2A2A] text-gray-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-gray-100">Kanban Board</h1>
      </header>

      {/* Dark Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
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
                  <span className="font-semibold text-sm text-gray-100">{column.name}</span>
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
                      <div className="flex flex-col gap-1 pr-2">
                        <p className="m-0 flex-1 font-semibold text-[14px] leading-tight text-white">
                          {feature.name}
                        </p>
                      </div>
                      {feature.owner && (
                        <Avatar className="h-6 w-6 shrink-0 border border-[#333333]">
                          <AvatarImage src={feature.owner.image} />
                          <AvatarFallback>
                            {feature.owner.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <p className="m-0 text-[#888888] text-[12px] mt-1">
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
    </div>
  );
}
