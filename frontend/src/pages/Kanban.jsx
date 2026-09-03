import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';

const COLUMNS = [
  { 
    id: 'planned', 
    name: 'Planned', 
    bgColor: 'bg-gray-100', 
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'in_progress', 
    name: 'In Progress', 
    bgColor: 'bg-yellow-50', 
    dotColor: 'bg-yellow-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'in_review', 
    name: 'In Review', 
    bgColor: 'bg-blue-50', 
    dotColor: 'bg-blue-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'done', 
    name: 'Done', 
    bgColor: 'bg-green-50', 
    dotColor: 'bg-green-500',
    textColor: 'text-gray-800'
  }
];

export default function KanbanPage({ onBack }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      setTasks(data);
    });
    return unsubscribe;
  }, []);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      await complaintService.updateComplaintStatus(taskId, targetStatus);
    }
  };

  // Format date range
  const formatDates = (start, end) => {
    if (!start) return '';
    const d1 = new Date(start);
    const d2 = new Date(end || start);
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${d2.toLocaleDateString('en-US', opts)}`;
  };

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col font-sans overflow-hidden">
      {/* App Bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center shadow-sm z-10 flex-shrink-0">
        <button 
          onClick={onBack}
          className="mr-4 p-1 rounded hover:bg-gray-100 text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-gray-900">Kanban Board</h1>
      </header>

      {/* Board Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className="w-[320px] h-full flex flex-col flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl rounded-b-xl mb-4 ${col.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`}></div>
                    <span className={`font-semibold text-sm ${col.textColor}`}>{col.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                      {colTasks.length}
                    </span>
                    <button className="bg-white text-blue-500 rounded p-0.5 shadow-sm hover:bg-blue-50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-3 custom-scrollbar">
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-4 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-gray-50 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex justify-between"
                    >
                      <div className="flex flex-col gap-3">
                        <h3 className="text-[13px] font-medium text-gray-800 leading-snug">{task.title}</h3>
                        <span className="text-[11px] text-gray-400">{formatDates(task.start_date, task.end_date)}</span>
                      </div>
                      {task.owner?.image ? (
                        <img 
                          src={task.owner.image} 
                          alt="owner" 
                          className="w-6 h-6 rounded-full mt-auto ml-2 flex-shrink-0 object-cover border border-gray-200" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 mt-auto ml-2 flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
