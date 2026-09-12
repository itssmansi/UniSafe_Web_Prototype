import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import ResolutionModal from './ResolutionModal';

// --- Configuration & Data ---
const COLUMNS = [
  { id: 'planned', title: 'Planned', dot: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
  { id: 'in-progress', title: 'In Progress', dot: '#F59E0B', bg: '#FDF8F0', border: '#F3E8D6' },
  { id: 'in-review', title: 'In Review', dot: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
  { id: 'done', title: 'Done', dot: '#10B98V', bg: '#F0FDF4', border: '#D1FAE5' },
];

// --- Subcomponents ---
const Card = ({ task, isDragging, onPointerDown }) => (
  <div 
    className={`bg-white rounded-[12px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]'}`}
    onPointerDown={onPointerDown}
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-[#111827] text-[13px] md:text-[15px] leading-snug pr-2">
        {task.title}
      </h4>
      <div className="flex items-center gap-1.5 shrink-0">
        {(task.upvote_count !== undefined && task.upvote_count > 0) && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full shadow-xs" title="Community Upvotes">
            ▲ {task.upvote_count}
          </span>
        )}
        <div 
          className={`w-3.5 h-3.5 rounded-full shrink-0 ${task.severity === 'HIGH' ? 'bg-red-500 shadow-sm shadow-red-500/50' : task.severity === 'MEDIUM' ? 'bg-amber-400' : 'bg-gray-200'}`}
          title={`Severity: ${task.severity || 'LOW'}`}
        ></div>
      </div>
    </div>

    {task.description && (
      <p className="text-[11px] text-gray-500 line-clamp-2 mb-2.5 font-normal leading-relaxed">
        {task.description}
      </p>
    )}

    <div className="flex justify-between items-center mt-1 border-t border-gray-50 pt-2">
      <p className="text-[9px] md:text-[11px] font-medium text-gray-400">
        {task.date}
      </p>
      {task.column === 'in-review' && (
        <span 
          className="text-[10px] md:text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1.5 select-none"
          title="Awaiting citizen verification"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Awaiting Citizen
        </span>
      )}
      {task.column === 'done' && (
        <span 
          className="text-[10px] md:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 select-none"
          title="Verified by citizens"
        >
          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Verified
        </span>
      )}
    </div>
  </div>
);

export default function KanbanBoard({ hideHeader = false }) {
  const navigate = useNavigate();
  const goBack = useSmartBack('/authority');
  const [tasks, setTasks] = useState([]);
  
  // Drag & Drop State
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cloneStyle, setCloneStyle] = useState({ width: 0, height: 0 });
  const [hoveredCol, setHoveredCol] = useState(null);
  const [resolutionModalTask, setResolutionModalTask] = useState(null);

  // Refs for event listeners
  const draggingTaskRef = useRef(null);
  const hoveredColRef = useRef(null);
  const longPressTimer = useRef(null);
  const startPos = useRef({x: 0, y: 0});

  useEffect(() => { draggingTaskRef.current = draggingTask; }, [draggingTask]);
  useEffect(() => { hoveredColRef.current = hoveredCol; }, [hoveredCol]);

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/kanban/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        const formattedTasks = data.map(item => ({
          id: item.id,
          title: item.title || item.category || 'Civic Issue',
          description: item.description || '',
          date: item.created_at && !isNaN(new Date(item.created_at).getTime())
            ? new Date(item.created_at).toLocaleDateString()
            : 'Recent',
          created_at: item.created_at,
          column: item.status || 'planned',
          upvote_count: item.upvote_count || 0,
          severity: item.severity || 'LOW',
          authority_image_url: item.authority_image_url || item.image_url,
          original: item
        }));
        setTasks(formattedTasks);
      }
    } catch (err) {
      console.error("Failed to fetch kanban tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateTaskStatus = async (taskId, newColumn) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: newColumn } : t));
    try {
      await fetch(`/api/kanban/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumn })
      });
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (draggingTaskRef.current) {
        e.preventDefault();
        setDragPos({ x: e.clientX, y: e.clientY });

        const els = document.elementsFromPoint(e.clientX, e.clientY);
        const colEl = els.find(el => el && el.getAttribute && el.getAttribute('data-column-id'));
        const newCol = colEl ? colEl.getAttribute('data-column-id') : null;
        
        if (newCol !== hoveredColRef.current) {
          setHoveredCol(newCol);
        }
      } else if (longPressTimer.current) {
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    };

    const handleUp = (e) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (draggingTaskRef.current) {
        const targetCol = hoveredColRef.current;
        const currentTask = draggingTaskRef.current;
        
        if (targetCol && targetCol !== currentTask.column) {
          if (targetCol === 'done') {
            alert("Only citizens can verify and close resolutions. Move the task to 'In Review' with proof to request citizen verification.");
          } else if (targetCol === 'in-review') {
            setResolutionModalTask(currentTask);
          } else {
            updateTaskStatus(currentTask.id, targetCol);
          }
        }
        setDraggingTask(null);
        setHoveredCol(null);
      }
    };

    const handleTouchMove = (e) => {
      if (draggingTaskRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointerrcancel', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handlePointerDown = (e, task) => {
    if (e.button !== 0 && e.pointerType !== 'mouse') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    startPos.current = { x: e.clientX, y: e.clientY };
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    const pointerType = e.pointerType;

    const pickup = () => {
      setCloneStyle({ width: rect.width, height: rect.height });
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggingTask(task);
      setDragPos({ x: clientX, y: clientY });
      
      if (window.navigator && window.navigator.vibrate && pointerType !== 'mouse') {
        window.navigator.vibrate(50);
      }
    };

    if (e.pointerType === 'mouse') {
      pickup();
    } else {
      longPressTimer.current = setTimeout(pickup, 250);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans flex flex-col select-none">
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header matching the phone screenshot (only on standalone route) */}
      {!hideHeader && (
        <div className="flex items-center justify-between py-3 px-4 sm:px-6 bg-[#F9FAFB] relative w-full mb-2">
          <button 
            onClick={() => goBack('/authority')} 
            title="Back"
            aria-label="Back"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1 text-sm font-medium text-gray-700 z-10 cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-[18px] md:text-[22px] font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 pointer-events-none">Kanban Board</h1>
          <button 
            onClick={() => navigate('/authority')} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors z-10 cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      )}
      
      {/* 4 Columns Layout: 1 col on mobile, 2 on tablet, all 4 fully visible on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 pb-6 flex-1 items-start px-3 sm:px-6 w-full h-[calc(100vh-80px)]">
        {COLUMNS.map(col => {
          const columnTasks = tasks
            .filter(t => t.column === col.id)
            .sort((a, b) => {
              // 1. Primary sort: Upvotes descending (highest priority goes UP)
              const upvoteDiff = (b.upvote_count || 0) - (a.upvote_count || 0);
              if (upvoteDiff !== 0) return upvoteDiff;
              // 2. Secondary sort: Newest first
              const dateA = new Date(a.created_at || a.date || 0).getTime() || 0;
              const dateB = new Date(b.created_at || b.date || 0).getTime() || 0;
              return dateB - dateA;
            });
          const isHovered = hoveredCol === col.id;

          return (
            <div 
              key={col.id} 
              className="w-full min-w-0 h-[calc(100vh-100px)] flex flex-col rounded-[16px] border transition-colors duration-200 overflow-hidden" 
              style={{ backgroundColor: isHovered ? col.border : col.bg, borderColor: col.border }}
            >
              {/* Header */}
              <div className="p-2.5 md:p-3 px-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: col.dot }}></div>
                  <h3 className="font-bold text-gray-900 text-[13px] md:text-[14px] truncate">{col.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <div className="bg-white px-2 py-0.5 rounded-[6px] text-[11px] font-bold shadow-xs border border-gray-100/60 flex items-center justify-center min-w-[22px]" style={{ color: col.dot }}>
                    {columnTasks.length}
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div 
                className="flex-1 p-2 md:p-2.5 pt-0 flex flex-col gap-2 overflow-y-auto hide-scroll pb-8" 
                data-column-id={col.id}
              >
                {columnTasks.map(task => (
                  <Card 
                    key={task.id} 
                    task={task} 
                    isDragging={draggingTask?.id === task.id} 
                    onPointerDown={(e) => handlePointerDown(e, task)}
                  />
                ))}
                
                {/* Drop Target Placeholder */}
                {isHovered && draggingTask && (
                  <div 
                    className="rounded-xl border-2 border-dashed bg-white/40 transition-all" 
                    style={{ height: cloneStyle.height, borderColor: col.dot }}
                  ></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visually Cloned Card for Dragging */}
      {draggingTask && (
        <div 
          id="drag-clone"
          className="fixed pointer-events-none z-[9999] opacity-95 scale-[1.03] shadow-2xl transition-transform origin-top-left"
          style={{
            left: dragPos.x - dragOffset.x,
            top: dragPos.y - dragOffset.y,
            width: cloneStyle.width,
            height: cloneStyle.height,
          }}
        >
          <div className="bg-white rounded-[12px] p-3 md:p-4 shadow-xl border-[2.5px] w-full h-full flex flex-col" style={{ borderColor: COLUMNS.find(c => c.id === draggingTask.column)?.dot || '#3B82F6' }}>
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <h4 className="font-medium text-[#111827] text-[12.5px] md:text-[15px] leading-snug pr-2 md:pr-4">{draggingTask.title}</h4>
              <div className="w-[18px] h-[18px] md:w-[24px] md:h-[24px] rounded-full bg-gray-200 shrink-0"></div>
            </div>
            <p className="text-[9px] md:text-[12px] font-medium text-gray-400">{draggingTask.date}</p>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModalTask && (
        <ResolutionModal
          task={resolutionModalTask}
          onClose={() => setResolutionModalTask(null)}
          onSuccess={() => {
            setTasks(prev => prev.map(t => 
              t.id === resolutionModalTask.id 
                ? { ...t, column: 'in-review' } 
                : t
            ));
            setResolutionModalTask(null);
          }}
        />
      )}
    </div>
  );
}
