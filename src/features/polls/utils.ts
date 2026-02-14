export function formatCountdown(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '< 1m left';
  if (diffMins < 60) return `${diffMins}m left`;

  const diffHours = Math.floor(diffMins / 60);
  const remainMins = diffMins % 60;
  if (diffHours < 24) {
    return remainMins > 0 ? `${diffHours}h ${remainMins}m left` : `${diffHours}h left`;
  }

  const diffDays = Math.floor(diffHours / 24);
  const remainHours = diffHours % 24;
  return remainHours > 0 ? `${diffDays}d ${remainHours}h left` : `${diffDays}d left`;
}
