import { useLocalSearchParams, router } from 'expo-router';

export default function InviteRedirect() {
  const { id } = useLocalSearchParams();
  router.replace({
    pathname: "/invitation",
    params: { token: id }
  });
  return null;
}
