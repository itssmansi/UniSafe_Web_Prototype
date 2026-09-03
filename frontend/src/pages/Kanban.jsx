import React from 'react';

const mockTasks = [
  { id: '1', title: 'Assistant Corporate Secretary', dates: 'Dec 4 - Dec 9, 2023', status: 'Planned' },
  { id: '2', title: 'Regional Manager', dates: 'Aug 17 - Sep 19, 2023', status: 'Planned' },
  { id: '3', title: 'Regional Consultant', dates: 'Jan 27 - Feb 19, 2023', status: 'Planned' },
  { id: '4', title: 'Associate Consultant', dates: 'May 24 - Jun 25, 2023', status: 'Planned' },
  { id: '5', title: 'Executive Secretary', dates: 'Jul 15 - Aug 3, 2023', status: 'Planned' },
  { id: '6', title: 'IT Secretary', dates: 'Sep 13 - Nov 3, 2023', status: 'Planned' },
  { id: '7', title: 'Executive Manager', dates: 'Dec 1 - Dec 10, 2023', status: 'Planned' },
  
  { id: '8', title: 'Operations Manager', dates: 'Sep 26 - Nov 8, 2023', status: 'In Progress' },
  
  { id: '9', title: 'Executive Manager', dates: 'Jul 25 - Aug 1, 2023', status: 'In Review' },
  { id: '10', title: 'Assistant President', dates: 'May 19 - Jun 29, 2023', status: 'In Review' },
  { id: '11', title: 'General President', dates: 'Apr 28 - Jun 17, 2023', status: 'In Review' },
  { id: '12', title: 'Executive Consultant', dates: 'Apr 8 - May 3, 2023', status: 'In Review' },
  
  { id: '13', title: 'Executive Consultant', dates: 'Jun 16 - Aug 9, 2023', status: 'Done' },
  { id: '14', title: 'Associate Division Secretary', dates: 'Dec 24 - Feb 18, 2024', status: 'Done' },
  { id: '15', title: 'Operations Secretary', dates: 'Sep 7 - Oct 2, 2023', status: 'Done' },
  { id: '16', title: 'Assistant Consultant', dates: 'Jun 18 - Jun 28, 2023', status: 'Done' },
  { id: '17', title: 'General Department Director', dates: 'Jun 10 - Jun 27, 2023', status: 'Done' },
  { id: '18', title: 'Assistant Department Consultant', dates: 'Jun 12 - Jul 7, 2023', status: 'Done' }
];

const COLUMNS = [
  { 
    id: 'Planned', 
    name: 'Planned', 
    count: 9, 
    bgColor: 'bg-gray-100', 
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'In Progress', 
    name: 'In Progress', 
    count: 1, 
    bgColor: 'bg-yellow-50', 
    dotColor: 'bg-yellow-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'In Review', 
    name: 'In Review', 
    count: 4, 
    bgColor: 'bg-blue-50', 
    dotColor: 'bg-blue-500',
    textColor: 'text-gray-800'
  },
  { 
    id: 'Done', 
    name: 'Done', 
    count: 6, 
    bgColor: 'bg-green-50', 
    dotColor: 'bg-green-500',
    textColor: 'text-gray-800'
  }
];

export default function KanbanPage({ onBack }) {
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
            const colTasks = mockTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-[320px] h-full flex flex-col flex-shrink-0">
                {/* Column Header */}
                <div className={lex items-center justify-between px-4 py-3 rounded-t-xl rounded-b-xl mb-4 \}>
                  <div className="flex items-center gap-2">
                    <div className={w-2 h-2 rounded-full \}></div>
                    <span className={ont-semibold text-sm \}>{col.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                      {col.count}
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
                      className="bg-white p-4 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-gray-50 hover:shadow-md transition-shadow cursor-pointer flex justify-between"
                    >
                      <div className="flex flex-col gap-3">
                        <h3 className="text-[13px] font-medium text-gray-800 leading-snug">{task.title}</h3>
                        <span className="text-[11px] text-gray-400">{task.dates}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 mt-auto ml-2 flex-shrink-0"></div>
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
