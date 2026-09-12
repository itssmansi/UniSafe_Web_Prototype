import { apiRequest } from './api';

export async function fetchHeatmapData() {
  try {
    const [heatmapRes, complaintsRes] = await Promise.allSettled([
      apiRequest('/heatmap'),
      apiRequest('/complaints')
    ]);

    const zones = (heatmapRes.status === 'fulfilled' && heatmapRes.value?.status === 'success')
      ? (heatmapRes.value.zones || [])
      : [];

    const complaints = (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value))
      ? complaintsRes.value
      : [];

    // Format individual complaint points: [lat, lng, weight, metadata]
    const complaintPoints = complaints
      .filter((c) => c.latitude && c.longitude && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
      .map((c) => {
        const upvotes = Number(c.upvote_count) || 0;
        const weight = Math.min(0.4 + upvotes * 0.1, 0.9);
        return [Number(c.latitude), Number(c.longitude), weight, c];
      });

    // Format zone core points
    const zonePoints = zones
      .filter((z) => z.latitude && z.longitude && !isNaN(Number(z.latitude)) && !isNaN(Number(z.longitude)))
      .map((z) => {
        const count = Number(z.complaint_count) || 0;
        let weight = 0.55;
        if (z.severity === 'HIGH') weight = 0.95;
        else if (z.severity === 'MEDIUM') weight = 0.75;
        else weight = 0.45;

        if (count >= 10) weight = Math.min(weight + 0.1, 1.0);

        return [Number(z.latitude), Number(z.longitude), weight, z];
      });

    return {
      zones,
      complaints,
      complaintPoints,
      zonePoints
    };
  } catch (error) {
    console.error('Error fetching heatmap data from backend:', error);
    throw error;
  }
}
