const existingColors = new Set<string>([
  '#FFF7ED', '#FFE8D7', '#FFD0B5', '#FFB088', '#FF8F5E', '#F46315', '#E14F04',
  '#BA3A02', '#942D05', '#7A2705', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB',
  '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#EFF6FF',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8',
  '#1E40AF', '#1E3A8A', '#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399',
  '#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#FEF2F2', '#FEE2E2',
  '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  '#7F1D1D', '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B',
  '#D97706', '#B45309', '#92400E', '#78350F'
]);

export const getColorForUUID = (uuid: string): string => {
  const hash = uuid.split('').reduce((acc, char) => 
    char.charCodeAt(0) + (acc << 6) + (acc << 16) - acc, 0);
  
  let color = '#';
  const baseColor = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  color += '00000'.substring(0, 6 - baseColor.length) + baseColor;

  // Ensure color doesn't match existing colors
  let attempts = 0;
  while(existingColors.has(color) && attempts < 100) {
    const shifted = (parseInt(color.slice(1), 16) + 0x1F1F1F) % 0xFFFFFF;
    color = '#' + shifted.toString(16).padStart(6, '0').toUpperCase();
    attempts++;
  }

  return color;
}; 