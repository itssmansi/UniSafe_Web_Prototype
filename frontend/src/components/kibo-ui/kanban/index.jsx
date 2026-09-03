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
      const updatedData = data.map(item =>
        item.id === itemId ? { ...item, column: columnId } : item
      );
      if (onDataChange) onDataChange(updatedData);
      await complaintService.updateComplaintStatus(itemId, columnId);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <KanbanContext.Provider value={{ data, handleDragStart, handleDrop, handleDragOver }}>
      <div className="flex gap-4 h-full min-w-max items-start">
        {columns.map(col => children(col))}
      </div>
    </KanbanContext.Provider>
  );
}

export function KanbanBoard({ id, children }) {
  const { handleDrop, handleDragOver } = useContext(KanbanContext);
  return (
    <div
      className="w-[280px] h-full flex flex-col flex-shrink-0 bg-[#232323] rounded-lg border border-[#333333] overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, id)}
    >
      {children}
    </div>
  );
}

export function KanbanHeader({ children }) {
  return (
    <div className="flex items-center px-4 py-3 bg-[#232323] border-b border-[#333333]">
      {children}
    </div>
  );
}

export function KanbanCards({ id, children }) {
  const { data } = useContext(KanbanContext);
  const columnData = data.filter(item => item.column === id);
  return (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar bg-[#232323]">
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
      className="bg-[#191919] p-4 rounded-md border border-[#333333] hover:border-[#444444] transition-colors cursor-grab active:cursor-grabbing flex flex-col gap-3"
    >
      {children}
    </div>
  );
}
