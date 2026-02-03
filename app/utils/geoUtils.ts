// app/utils/geoUtils.ts

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const calculateTotalTravel = (stamps: any[]) => {
  if (!stamps || stamps.length < 2) return 0;

  // 1. Sort stamps by date (handling Firebase timestamps)
  const sorted = [...stamps].sort((a, b) => {
    const timeA = a.createdAt?.seconds
      ? a.createdAt.seconds * 1000
      : new Date(a.date || 0).getTime();
    const timeB = b.createdAt?.seconds
      ? b.createdAt.seconds * 1000
      : new Date(b.date || 0).getTime();
    return timeA - timeB;
  });

  let total = 0;

  // 2. Loop through and calculate distance between consecutive points
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];

    if (start.lat && start.lng && end.lat && end.lng) {
      total += calculateDistance(
        Number(start.lat),
        Number(start.lng),
        Number(end.lat),
        Number(end.lng),
      );
    }
  }

  return Math.round(total);
};
