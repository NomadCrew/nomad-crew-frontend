import { OnboardingSlide } from '@/src/types/onboarding';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Travel Together,\nStress Less',
    subtitle: 'The all-in-one app for coordinating group travel',
    image: require('@/assets/images/group-travel.png'),
    backgroundColor: '#FFFFFF', // We'll handle this dynamically in the component
  },
  {
    id: 'features',
    title: 'Keep Everyone\nin Sync',
    subtitle: 'Real-time updates keep everyone on the same page',
    image: require('@/assets/images/sync.png'),
    backgroundColor: '#F46315',
  },
  {
    id: 'start',
    title: 'Ready for\nAdventure?',
    subtitle: 'Join thousands of travelers making memories together',
    image: require('@/assets/images/adventure.png'),
    backgroundColor: '#FFF7ED',
  },
];