import React, { useState, useEffect } from 'react';
import { complaintService, ISSUE_CATEGORIES } from '../services/complaintService';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanTaskModal from '../components/kanban/KanbanTaskModal';
import ComplaintDetails from '../components/map/ComplaintDetails';

export default function KanbanPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('planned');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isMobileGrid, setIsMobileGrid] = useState(false);

  // Live synchronization via complaintService
  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      setComplaints(data);
      if (selectedComplaint) {
        const updated = data.find((c) => c.id === selectedComplaint.id);
        setSelectedComplaint(updated || null);
      }
    });
    return unsubscribe;
  }, [selectedComplaint]);

  const handleStatusChange = async (id, newStatus) => {
    await complaintService.updateComplaintStatus(id, newStatus);
  };

  const handleCreateTask = async (taskData) => {
    await complaintService.createComplaint(taskData);
    setIsTaskModalOpen(false);
  };

  const handleOpenAddTask = (columnId = 'planned') => {
    setTargetColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  const handleUpvote = async (id) => {
    await complaintService.upvoteComplaint(id);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subcategory && c.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory =
      categoryFilter === 'all' || c.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* AppBar Ported from Flutter KanbanBoardScreen */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                UniSafe <span className="text-blue-600 font-semibold text-base">Kanban Board</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AppFlowy-style workflow triage across municipal authority columns
              </p>
            </div>
          </div>

          {/* Search, Filter & Layout Toggles */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-52"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Categories</option>
              {Object.entries(ISSUE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            {/* Grid vs Board Layout Toggle (Ported from Flutter _buildMobileGrid / _buildDesktopBoard) */}
            <button
              type="button"
              onClick={() => setIsMobileGrid(!isMobileGrid)}
              className={`p-2 rounded-xl border text-xs font-semibold transition ${
                isMobileGrid
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle 2x2 Grid View"
            >
              {isMobileGrid ? '📱 2x2 Grid' : '🖥️ Board'}
            </button>

            {/* Add Task Primary Action */}
            <button
              type="button"
              onClick={() => handleOpenAddTask('planned')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <span>+</span> Add Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Kanban Board Canvas */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <KanbanBoard
          complaints={filteredComplaints}
          onStatusChange={handleStatusChange}
          onOpenAddTask={handleOpenAddTask}
          onSelectComplaint={(task) => setSelectedComplaint(task)}
          isMobileGrid={isMobileGrid}
        />
      </main>

      {/* Add Task Modal */}
      <KanbanTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultColumnId={targetColumnId}
        onSubmit={handleCreateTask}
      />

      {/* Task Details Dialog on Card Click */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <ComplaintDetails
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onStatusChange={handleStatusChange}
            onUpvote={handleUpvote}
          />
        </div>
      )}
    </div>
  );
}
