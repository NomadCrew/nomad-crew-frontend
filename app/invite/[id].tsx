import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';

export default function InviteRedirect() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    const extractToken = (rawId: string) => {
      // Handle both URL paths and raw tokens
      const token = rawId.split('/').pop() || rawId;
      return token.replace(/^\/+/, '');
    };

    if (typeof id === 'string') {
      const token = extractToken(id);
      router.replace({
        pathname: "/invitation",
        params: { token }
      });
    }
  }, [id]);

  return null;
}
