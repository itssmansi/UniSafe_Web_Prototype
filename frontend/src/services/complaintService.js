// Complaint Service (Pranav's Domain)
// Structured according to Supabase schema defined in AGENT.md

let listeners = [];

// Seed mock complaints so the Map and Kanban are immediately functional
let mockComplaints = [
  {
    id: "c-101",
    citizen_id: "cit-01",
    citizen_name: "Rahul Sharma",
    category: "Streetlight",
    description: "Main road streetlights have been flickering and went completely dark near Sector 4 junction.",
    latitude: 19.0760,
    longitude: 72.8777,
    severity: "medium", // 'low' | 'medium' | 'high' | 'critical'
    status: "pending",   // 'pending' | 'in_progress' | 'resolved'
    assigned_authority_id: null,
    assigned_department: null,
    original_photo_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=60",
    resolution_photo_url: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: "c-102",
    citizen_id: "cit-02",
    citizen_name: "Priya Patel",
    category: "Pothole",
    description: "Deep pothole causing bike skids right in front of the community center entrance.",
    latitude: 19.0820,
    longitude: 72.8850,
    severity: "critical",
    status: "in_progress",
    assigned_authority_id: "auth-101",
    assigned_department: "Road Maintenance Dept",
    original_photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60",
    resolution_photo_url: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: "c-103",
    citizen_id: "cit-03",
    citizen_name: "Amit Verma",
    category: "Garbage",
    description: "Unattended municipal garbage dump overflowing onto the sidewalk.",
    latitude: 19.0680,
    longitude: 72.8690,
    severity: "high",
    status: "pending",
    assigned_authority_id: null,
    assigned_department: null,
    original_photo_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=60",
    resolution_photo_url: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: "c-104",
    citizen_id: "cit-04",
    citizen_name: "Sneha Nair",
    category: "Water Leak",
    description: "Pipeline burst near the public park causing heavy water accumulation.",
    latitude: 19.0910,
    longitude: 72.8920,
    severity: "high",
    status: "resolved",
    assigned_authority_id: "auth-102",
    assigned_department: "Water & Sewage Board",
    original_photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=600&auto=format&fit=crop&q=60",
    resolution_photo_url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
];

function notify() {
  listeners.forEach((listener) => listener([...mockComplaints]));
}

export const complaintService = {
  // Get all complaints
  async getComplaints() {
    return [...mockComplaints];
  },

  // Get single complaint by ID
  async getComplaintById(id) {
    return mockComplaints.find((c) => c.id === id) || null;
  },

  // Create new complaint (Citizen action)
  async createComplaint(data) {
    const newComplaint = {
      id: `c-${Date.now().toString().slice(-4)}`,
      citizen_id: data.citizen_id || "guest-citizen",
      citizen_name: data.citizen_name || "Anonymous Citizen",
      category: data.category || "General",
      description: data.description || "",
      latitude: parseFloat(data.latitude) || 19.0760,
      longitude: parseFloat(data.longitude) || 72.8777,
      severity: data.severity || "medium",
      status: "pending",
      assigned_authority_id: null,
      assigned_department: null,
      original_photo_url: data.original_photo_url || "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=60",
      resolution_photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockComplaints = [newComplaint, ...mockComplaints];
    notify();
    return newComplaint;
  },

  // Update status (Authority action)
  async updateComplaintStatus(id, newStatus, resolutionPhotoUrl = null) {
    mockComplaints = mockComplaints.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          resolution_photo_url: resolutionPhotoUrl || c.resolution_photo_url,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    notify();
    return mockComplaints.find((c) => c.id === id);
  },

  // Assign Authority/Department
  async assignComplaint(id, authorityId, department) {
    mockComplaints = mockComplaints.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          assigned_authority_id: authorityId,
          assigned_department: department,
          status: c.status === "pending" ? "in_progress" : c.status,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    notify();
    return mockComplaints.find((c) => c.id === id);
  },

  // Subscribe to live updates
  subscribe(listener) {
    listeners.push(listener);
    listener([...mockComplaints]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
