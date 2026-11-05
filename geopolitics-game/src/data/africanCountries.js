export const AFRICAN_COUNTRIES = [
  { id: 'ZA', name: 'South Africa', flag: '🇿🇦', populationMb: 60, path: "M 220 310 L 260 300 L 270 340 L 230 350 Z" },
  { id: 'AO', name: 'Angola', flag: '🇦🇴', populationMb: 35, path: "M 180 230 L 220 230 L 220 270 L 180 260 Z" },
  { id: 'NG', name: 'Nigeria', flag: '🇳🇬', populationMb: 218, path: "M 140 140 L 180 140 L 180 180 L 140 170 Z" },
  { id: 'KE', name: 'Kenya', flag: '🇰🇪', populationMb: 55, path: "M 270 180 L 300 180 L 290 220 L 260 210 Z" },
  { id: 'EG', name: 'Egypt', flag: '🇪🇬', populationMb: 109, path: "M 230 50 L 280 50 L 270 90 L 220 80 Z" },
  { id: 'GH', name: 'Ghana', flag: '🇬🇭', populationMb: 33, path: "M 100 150 L 130 150 L 130 180 L 100 170 Z" },
  { id: 'ET', name: 'Ethiopia', flag: '🇪🇹', populationMb: 123, path: "M 280 130 L 330 130 L 320 170 L 270 160 Z" },
  { id: 'CD', name: 'DR Congo', flag: '🇨🇩', populationMb: 99, path: "M 200 180 L 250 180 L 240 230 L 190 220 Z" },
  { id: 'TZ', name: 'Tanzania', flag: '🇹🇿', populationMb: 65, path: "M 250 210 L 290 210 L 280 250 L 240 240 Z" },
  { id: 'MA', name: 'Morocco', flag: '🇲🇦', populationMb: 37, path: "M 110 30 L 160 30 L 150 70 L 100 60 Z" }
];

export function getAfricanSoldierCount(popMb) {
  if (!Number.isFinite(popMb) || popMb < 0) {
    throw new RangeError('Population must be a non-negative number of millions.');
  }

  if (popMb <= 5) return 1;
  if (popMb <= 10) return 2;
  if (popMb <= 25) return 3;
  if (popMb <= 50) return 4;
  if (popMb <= 75) return 5;
  if (popMb <= 100) return 6;
  if (popMb <= 125) return 7;
  if (popMb <= 150) return 8;
  return 9;
}