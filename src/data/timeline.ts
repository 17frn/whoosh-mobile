export interface TimelineMoment {
  title: string;
  description: string;
  image: string;
  accentColor: string;
  localImageId?: string; // Menyimpan referensi ID untuk High-Res image di IndexedDB
}

export interface TimelineData {
  id: string;
  title: string;
  location: string;
  date: string;
  year: number;
  dotColor: string;
  rtl: boolean;
  mapEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
  moments: TimelineMoment[];
}

// Intentionally empty — app starts with clean state for every new account
export const timelineItems: TimelineData[] = [];

export const getSortedTimeline = (): TimelineData[] => {
  const monthMap: Record<string, number> = {
    "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
    "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
  };

  return [...timelineItems].sort((a, b) => {
    const parseDate = (dateStr: string, fallbackYear: number) => {
      const parts = dateStr.split(" ");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]] || 0;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day).getTime();
      }
      return new Date(fallbackYear, 0, 1).getTime();
    };

    return parseDate(b.date, b.year) - parseDate(a.date, a.year);
  });
};
