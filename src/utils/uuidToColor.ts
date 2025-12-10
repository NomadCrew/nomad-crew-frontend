const existingColors = new Set<string>([
  '#FFF7ED',
  '#FFE8D7',
  '#FFD0B5',
  '#FFB088',
  '#FF8F5E',
  '#F46315',
  '#E14F04',
  '#BA3A02',
  '#942D05',
  '#7A2705',
  '#F9FAFB',
  '#F3F4F6',
  '#E5E7EB',
  '#D1D5DB',
  '#9CA3AF',
  '#6B7280',
  '#4B5563',
  '#374151',
  '#1F2937',
  '#111827',
  '#EFF6FF',
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  '#1E40AF',
  '#1E3A8A',
  '#ECFDF5',
  '#D1FAE5',
  '#A7F3D0',
  '#6EE7B7',
  '#34D399',
  '#10B981',
  '#059669',
  '#047857',
  '#065F46',
  '#064E3B',
  '#FEF2F2',
  '#FEE2E2',
  '#FECACA',
  '#FCA5A5',
  '#F87171',
  '#EF4444',
  '#DC2626',
  '#B91C1C',
  '#991B1B',
  '#7F1D1D',
  '#FFFBEB',
  '#FEF3C7',
  '#FDE68A',
  '#FCD34D',
  '#FBBF24',
  '#F59E0B',
  '#D97706',
  '#B45309',
  '#92400E',
  '#78350F',
]);

const calculateLuminance = (color: string): number => {
  const rgb = color
    .slice(1)
    .match(/.{2}/g)
    ?.map((hex) => parseInt(hex, 16) / 255) || [0, 0, 0];
  const [r = 0, g = 0, b = 0] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
};

export const getColorForUUID = (uuid: string, backgroundColor: string = '#121212'): string => {
  const hash = uuid
    .split('')
    .reduce((acc, char) => char.charCodeAt(0) + (acc << 6) + (acc << 16) - acc, 0);

  let color = '#';
  const baseColor = (hash & 0x00ffffff).toString(16).toUpperCase();
  color += '00000'.substring(0, 6 - baseColor.length) + baseColor;

  // Ensure the generated color meets contrast requirements
  let attempts = 0;
  while (
    (existingColors.has(color) || getContrastRatio(color, backgroundColor) < 4.5) &&
    attempts < 100
  ) {
    const shifted = (parseInt(color.slice(1), 16) + 0x1f1f1f) % 0xffffff;
    color = '#' + shifted.toString(16).padStart(6, '0').toUpperCase();
    attempts++;
  }

  return color;
};
