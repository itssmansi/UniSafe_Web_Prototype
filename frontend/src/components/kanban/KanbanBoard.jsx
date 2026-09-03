import React, { useState } from 'react';
import ComplaintCard from './ComplaintCard';
import { KANBAN_COLUMNS } from '../../services/complaintService';

export default function KanbanBoard({
  complaints = [],
  onStatusChange,
  onOpenAddTask,
  onSelectComplaint,
  isMobileGrid = false,
}) {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id && onStatusChange) {
      onStatusChange(id, targetColumnId);
    }
    setDraggedId(null);
  };

  return (
    <div
      className={
        isMobileGrid
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 items-start'
          : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start'
      }
    >
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = complaints.filter((c) => c.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="rounded-2xl border p-3 flex flex-col min-h-[580px] shadow-xs transition-colors"
            style={{
              backgroundColor: `${col.color}0D`, // col.color with 5% opacity matching Flutter
              borderColor: `${col.color}33`,
            }}
          >
            {/* Header Ported from Flutter _buildHeader */}
            <div
              className="p-3 rounded-xl flex items-center justify-between shadow-xs mb-3 border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: `${col.color}25`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="font-semibold text-xs text-slate-800 tracking-tight">
                  {col.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Count Pill */}
                <div
                  className="px-2 py-0.5 rounded-lg border text-[11px] font-bold"
                  style={{
                    color: col.color,
                    borderColor: `${col.color}40`,
                    backgroundColor: `${col.color}10`,
                  }}
                >
                  {colTasks.length}
                </div>

                {/* Add Task Button (Ported from Flutter) */}
                <button
                  type="button"
                  onClick={() => onOpenAddTask && onOpenAddTask(col.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center border hover:scale-105 transition"
                  style={{
                    borderColor: `${col.color}40`,
                    color: col.color,
                    backgroundColor: '#FFFFFF',
                  }}
                  title={`Add to ${col.name}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
              {colTasks.length === 0 ? (
                <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs font-medium"
                     style={{ borderColor: `${col.color}25` }}>
                  <span>No tasks</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="active:opacity-50 transition-opacity"
                  >
                    <ComplaintCard
                      complaint={task}
                      onStatusChange={onStatusChange}
                      onSelect={onSelectComplaint}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
