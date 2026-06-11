export const USER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#F7DC6F',
  '#DDA0DD',
  '#F0B27A',
  '#BB8FCE',
  '#82E0AA',
  '#F1948A',
];

export function getNextColor(usedColors: string[]): string {
  const available = USER_COLORS.find((c) => !usedColors.includes(c));
  return available ?? USER_COLORS[usedColors.length % USER_COLORS.length];
}
