import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'Streetlight', label: 'Streetlight / Electrical', icon: '💡' },
  { id: 'Pothole', label: 'Pothole / Road Damage', icon: '🕳️' },
  { id: 'Garbage', label: 'Garbage / Sanitation', icon: '🗑️' },
  { id: 'Water Leak', label: 'Water Leakage / Pipe Burst', icon: '💧' },
  { id: 'Safety', label: 'Public Safety Hazard', icon: '🚨' },
  { id: 'Other', label: 'Other Civic Issue', icon: '📍' },
];

const SEVERITIES = [
  { id: 'low', label: 'Low', color: 'border-slate-300 text-slate-700 hover:bg-slate-50' },
  { id: 'medium', label: 'Medium', color: 'border-yellow-300 text-yellow-800 hover:bg-yellow-50' },
  { id: 'high', label: 'High', color: 'border-orange-400 text-orange-800 hover:bg-orange-50' },
  { id: 'critical', label: 'Critical', color: 'border-red-500 text-red-700 bg-red-50/50 hover:bg-red-50' },
];

export default function ComplaintModal({
  isOpen,
  onClose,
  onSubmit,
  defaultCoords = { lat: 19.0760, lng: 72.8777 },
}) {
  const [category, setCategory] = useState('Pothole');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [latitude, setLatitude] = useState(defaultCoords.lat);
  const [longitude, setLongitude] = useState(defaultCoords.lng);
  const [citizenName, setCitizenName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update coords if defaultCoords changes (e.g. user clicked map)
  React.useEffect(() => {
    if (defaultCoords) {
      setLatitude(defaultCoords.lat);
      setLongitude(defaultCoords.lng);
    }
  }, [defaultCoords]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description for the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        description,
        severity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        citizen_name: citizenName.trim() || 'Anonymous Citizen',
        original_photo_url:
          photoUrl ||
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
      });
      setDescription('');
      setPhotoUrl('');
      setCitizenName('');
      onClose();
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      alert('Could not submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Report Civic Issue</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pinned at: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    category === cat.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Urgency / Severity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITIES.map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverity(sev.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${sev.color} ${
                    severity === sev.id
                      ? 'ring-2 ring-offset-1 ring-slate-900 shadow-sm font-bold scale-[1.02]'
                      : 'opacity-70'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description of the Issue *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details (e.g. deep pothole near junction, broken wire dangling, etc.)..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          {/* Citizen Name & Photo Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Photo Evidence
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Photo Preview if uploaded */}
          {photoUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={photoUrl} alt="Evidence preview" className="w-full h-36 object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 text-xs transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : '🚀 Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
