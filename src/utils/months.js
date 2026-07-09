export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatMonthRange(startMonth, endMonth) {
  if (startMonth === endMonth) return MONTH_NAMES[startMonth - 1];
  return `${MONTH_NAMES[startMonth - 1]}–${MONTH_NAMES[endMonth - 1]}`;
}
