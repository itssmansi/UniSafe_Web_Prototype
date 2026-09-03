import React, { createContext, useContext } from 'react';
import { complaintService } from '../../../services/complaintService';

const KanbanContext = createContext();

export function KanbanProvider({ columns, data, onDataChange, children }) {
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      // Instantly update the parent state for snappy UI
      const updatedData = data.map(item =>
        item.id === itemId ? { ...item, column: columnId } : item
      );
      if (onDataChange) onDataChange(updatedData);

      // Persist the change to our mock database
      await complaintService.updateComplaintStatus(itemId, columnId);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <KanbanContext.Provider value={{ data, handleDragStart, handleDrop, handleDragOver }}>
      <div className="flex gap-6 h-full min-w-max items-start">
        {columns.map(col => children(col))}
      </div>
    </KanbanContext.Provider>
  );
}

export function KanbanBoard({ id, children }) {
  const { handleDrop, handleDragOver } = useContext(KanbanContext);
  return (
    <div
      className="w-[320px] h-full flex flex-col flex-shrink-0"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, id)}
    >
      {children}
    </div>
  );
}

export function KanbanHeader({ children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-t-xl rounded-b-xl mb-4 bg-white border border-gray-100 shadow-sm">
      {children}
    </div>
  );
}

export function KanbanCards({ id, children }) {
  const { data } = useContext(KanbanContext);
  // Match the items belonging to this column ID
  const columnData = data.filter(item => item.column === id);
  return (
    <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-3 custom-scrollbar">
      {columnData.map(item => children(item))}
    </div>
  );
}

export function KanbanCard({ id, children }) {
  const { handleDragStart } = useContext(KanbanContext);
  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      className="bg-white p-4 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-gray-50 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex flex-col gap-3"
    >
      {children}
    </div>
  );
}
