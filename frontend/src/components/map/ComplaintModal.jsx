import React, { useState } from 'react';
import { ISSUE_CATEGORIES } from '../../services/complaintService';

export default function ComplaintModal({
  isOpen,
  onClose,
  onSubmit,
  defaultCoords = { lat: 28.6139, lng: 77.2090 },
}) {
  const [selectedCatKey, setSelectedCatKey] = useState('infrastructure');
  const [subcategory, setSubcategory] = useState(
    ISSUE_CATEGORIES.infrastructure.subcategories[0]
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCategory = ISSUE_CATEGORIES[selectedCatKey];

  const handleCategoryChange = (catKey) => {
    setSelectedCatKey(catKey);
    setSubcategory(ISSUE_CATEGORIES[catKey].subcategories[0]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe the civic issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || `${subcategory} Report`,
        category: selectedCatKey,
        subcategory,
        description: description.trim(),
        address: address.trim() || 'Reported from Map Viewport',
        latitude: defaultCoords.lat,
        longitude: defaultCoords.lng,
        image_url:
          imagePreview ||
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
      });
      setTitle('');
      setDescription('');
      setAddress('');
      setImagePreview('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with selected category color banner */}
        <div
          className="p-5 text-white flex items-center justify-between transition-colors duration-300"
          style={{ backgroundColor: currentCategory.color }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentCategory.icon}</span>
            <div>
              <h2 className="text-xl font-bold leading-tight">Report Civic Issue</h2>
              <p className="text-xs opacity-90">
                Pin at {defaultCoords.lat.toFixed(4)}, {defaultCoords.lng.toFixed(4)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-black/10 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Category Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(ISSUE_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    selectedCatKey === key
                      ? 'ring-2 font-bold text-white shadow-md'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  style={{
                    backgroundColor: selectedCatKey === key ? cat.color : '#FFFFFF',
                    borderColor: selectedCatKey === key ? cat.color : '#E2E8F0',
                  }}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[11px] leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Dropdown (Ported from Flutter kSubcategories) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Specific Issue Type (Subcategory)
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {currentCategory.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Report Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${subcategory} near block entrance`}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the situation or risk..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Address / Landmark */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Location Landmark / Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Library Gate, Sector 3"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Attach Photo Evidence
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 h-28">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview('')}
                  className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl text-white font-bold transition shadow-lg text-xs"
              style={{
                backgroundColor: currentCategory.color,
                boxShadow: `0 4px 15px ${currentCategory.glowColor}`,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Post Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
