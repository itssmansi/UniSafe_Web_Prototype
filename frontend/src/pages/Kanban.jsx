import React, { useState, useEffect } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "../components/kibo-ui/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { complaintService } from "../services/complaintService";

const columns = [
  { id: "planned", name: "Planned", color: "#6B7280" },
  { id: "in_progress", name: "In Progress", color: "#F59E0B" },
  { id: "in_review", name: "In Review", color: "#3B82F6" },
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
    // Subscribe to our real database instead of Faker
    const unsubscribe = complaintService.subscribe((data) => {
      const formatted = data.map(c => ({
        id: c.id,
        name: c.title,
        column: c.status,
        startAt: new Date(c.start_date || c.created_at),
        endAt: new Date(c.end_date || Date.now()),
        owner: c.owner
      }));
      setFeatures(formatted);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col font-sans overflow-hidden">
      {/* App Bar to let you navigate back to Home */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center shadow-sm z-10 flex-shrink-0">
        <button onClick={onBack} className="mr-4 p-1 rounded hover:bg-gray-100 text-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-gray-900">Kanban Board</h1>
      </header>

      {/* Your Exact Kibo-UI Kanban Code implementation */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <KanbanProvider
          columns={columns}
          data={features}
          onDataChange={setFeatures}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="font-semibold text-sm text-gray-800">{column.name}</span>
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
                        <p className="m-0 flex-1 font-medium text-[13px] leading-snug text-gray-800">
                          {feature.name}
                        </p>
                      </div>
                      {feature.owner && (
                        <Avatar className="h-6 w-6 shrink-0 border border-gray-200">
                          <AvatarImage src={feature.owner.image} />
                          <AvatarFallback>
                            {feature.owner.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <p className="m-0 text-gray-400 text-[11px] mt-2">
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
