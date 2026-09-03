// Centralized Category Identity ported from Flutter:
// C:\projects\Unisafe\flutter_app\lib\screens\heatmap_ui\map_screen.dart

export const ISSUE_CATEGORIES = {
  infrastructure: {
    id: 'infrastructure',
    label: 'Infrastructure',
    color: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.45)',
    icon: '🏗️',
    subcategories: [
      'Nonfunctional street lights',
      'Potholes',
      'Water logging',
      'Prolonged road work',
      'Drainage',
      'Other',
    ],
  },
  sanitation: {
    id: 'sanitation',
    label: 'Sanitation',
    color: '#F9A826',
    glowColor: 'rgba(249, 168, 38, 0.45)',
    icon: '🗑️',
    subcategories: [
      'Garbage scattered on the road',
      'Public washrooms not clean',
      'Garbage beach/river',
      'Untimely garbage collection/overflowing',
      'Other',
    ],
  },
  safety: {
    id: 'safety',
    label: 'Safety',
    color: '#4D96FF',
    glowColor: 'rgba(77, 150, 255, 0.45)',
    icon: '🛡️',
    subcategories: [
      'Open manholes',
      'Non existent footpath',
      'Women safety',
      'Illegal parking',
      'Theft / Robbery',
      'Harassment / Eve-Teasing',
      'Assault / Violence',
      'Poor Street Lighting',
      'Fire Hazard',
      'Electrical Hazard',
      'Exposed Wires',
      'Child Safety Concern',
      'Stray Animal Threat',
      'Other',
    ],
  },
  greenery: {
    id: 'greenery',
    label: 'Greenery',
    color: '#4CAF50',
    glowColor: 'rgba(76, 175, 80, 0.45)',
    icon: '🌿',
    subcategories: [
      'Waste Dumping in Green Area',
      'Poor Landscape Maintenance',
      'Watering Required for Plants',
      'Encroachment on Green Spaces',
      'Pest or Insect Infestation',
      'Overgrown Vegetation',
      'Need Tree Plantation',
      'Illegal Tree Cutting',
      'Public problems on greenery',
      'Other',
    ],
  },
};

// 4 Columns ported from Flutter:
// C:\projects\Unisafe\flutter_app\lib\screens\kanban_board_ui\kanban_board_screen.dart
export const KANBAN_COLUMNS = [
  { id: 'planned', name: 'Planned', color: '#6B7280' },
  { id: 'in_progress', name: 'In Progress', color: '#F59E0B' },
  { id: 'in_review', name: 'In Review', color: '#3B82F6' },
  { id: 'done', name: 'Done', color: '#10B981' },
];

let listeners = [];

// Seed complaints matching schema.sql + map_screen.dart + kanban_board_screen.dart
let mockComplaints = [
  {
    id: 'rep-001',
    title: 'Hazardous Potholes at Main Junction',
    category: 'infrastructure',
    subcategory: 'Potholes',
    description: 'Deep potholes causing severe bike skids near the university south gate.',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'South Gate Corridor, University Main Road',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
    status: 'planned',
    upvote_count: 14,
    owner: {
      name: 'Amit Deshmukh',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60',
    },
    start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rep-002',
    title: 'Nonfunctional Streetlights Behind Library',
    category: 'infrastructure',
    subcategory: 'Nonfunctional street lights',
    description: 'Pathway is pitch dark after 7:30 PM, creating major security concerns for students.',
    latitude: 28.6210,
    longitude: 77.2150,
    address: 'Library Lane, Central Campus',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=60',
    status: 'in_progress',
    upvote_count: 28,
    owner: {
      name: 'Rohan Verma',
      image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=60',
    },
    start_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rep-003',
    title: 'Garbage Dump Overflowing Near Cafeteria',
    category: 'sanitation',
    subcategory: 'Untimely garbage collection/overflowing',
    description: 'Bins have not been emptied for 4 days. Waste is spilling onto the pedestrian pathway.',
    latitude: 28.6080,
    longitude: 77.2020,
    address: 'Cafeteria Block 3, North Yard',
    image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=60',
    status: 'in_review',
    upvote_count: 9,
    owner: {
      name: 'Pooja Nair',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=60',
    },
    start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'rep-004',
    title: 'Exposed Electrical Wires Near Playground',
    category: 'safety',
    subcategory: 'Exposed Wires',
    description: 'High voltage wire hanging low from junction box near the kids park.',
    latitude: 28.6250,
    longitude: 77.2220,
    address: 'Campus Recreation Park',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=600&auto=format&fit=crop&q=60',
    status: 'in_progress',
    upvote_count: 42,
    owner: {
      name: 'Kunal Sharma',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60',
    },
    start_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'rep-005',
    title: 'Waste Dumping in Botanical Garden',
    category: 'greenery',
    subcategory: 'Waste Dumping in Green Area',
    description: 'Plastic debris and construction gravel dumped into flowerbeds.',
    latitude: 28.6180,
    longitude: 77.1980,
    address: 'Botanical Garden Sector B',
    image_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60',
    status: 'done',
    upvote_count: 19,
    owner: {
      name: 'Ananya Gupta',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=60',
    },
    start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    end_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

function notify() {
  listeners.forEach((fn) => fn([...mockComplaints]));
}

export const complaintService = {
  async getComplaints() {
    return [...mockComplaints];
  },

  async getComplaintById(id) {
    return mockComplaints.find((c) => c.id === id) || null;
  },

  async createComplaint(data) {
    const categoryInfo = ISSUE_CATEGORIES[data.category] || ISSUE_CATEGORIES.infrastructure;
    const newComplaint = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      title: data.title || `${data.subcategory || categoryInfo.label} Report`,
      category: data.category || 'infrastructure',
      subcategory: data.subcategory || categoryInfo.subcategories[0],
      description: data.description || '',
      latitude: parseFloat(data.latitude) || 28.6139,
      longitude: parseFloat(data.longitude) || 77.2090,
      address: data.address || 'Selected Map Location',
      image_url:
        data.image_url ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
      status: data.status || 'planned',
      upvote_count: 1,
      owner: data.owner || {
        name: 'Pranav (You)',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60',
      },
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      created_at: new Date().toISOString(),
    };

    mockComplaints = [newComplaint, ...mockComplaints];
    notify();
    return newComplaint;
  },

  async updateComplaintStatus(id, newStatus) {
    mockComplaints = mockComplaints.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    notify();
    return mockComplaints.find((c) => c.id === id);
  },

  async upvoteComplaint(id) {
    mockComplaints = mockComplaints.map((c) => {
      if (c.id === id) {
        return { ...c, upvote_count: (c.upvote_count || 0) + 1 };
      }
      return c;
    });
    notify();
    return mockComplaints.find((c) => c.id === id);
  },

  subscribe(listener) {
    listeners.push(listener);
    listener([...mockComplaints]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
