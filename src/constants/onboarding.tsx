import { OnboardingSlide } from '@/src/types/onboarding';

const commonStyles = {
  backgroundOpacity: 0.9,
  image: {
    marginTop: 20,
    paddingBottom: 50,
    width: 320,
    height: 320,
    transform: [{ scale: 1.0 }],
    opacity: 1,
    borderRadius: 50,
  },
  darkTitle: {
    fontSize: 32,
    fontWeight: 'bold' as 'bold',
    marginTop: 50,
    color: '#1F2937',
  },
  lightTitle: {
    fontSize: 32,
    fontWeight: 'bold' as 'bold',
    color: '#FFFFFF',
  },
  darkSubtitle: {
    color: '#4B5563',
  },
  lightSubtitle: {
    color: '#FFFFFF',
    opacity: 0.5,
  },
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Travel Together,\nStress Less',
    subtitle: 'The all-in-one app for coordinating group travel',
    image: require('@/assets/images/group-travel.png'),
    backgroundColor: '#FFF7ED',
    titleStyles: commonStyles.darkTitle,
    subtitleStyles: commonStyles.darkSubtitle,
    imageStyles: commonStyles.image,
    backgroundOpacity: commonStyles.backgroundOpacity,
  },
  {
    id: 'features',
    title: 'Keep Everyone\nin Sync',
    subtitle: 'Real-time updates keep everyone on the same page',
    image: require('@/assets/images/sync.png'),
    backgroundColor: '#F46315',
    titleStyles: commonStyles.darkTitle,
    subtitleStyles: commonStyles.darkSubtitle,
    imageStyles: commonStyles.image,
    backgroundOpacity: commonStyles.backgroundOpacity,
  },
  {
    id: 'start',
    title: 'Ready for\nAdventure?',
    subtitle: 'Join thousands of travelers making memories together',
    image: require('@/assets/images/adventure.png'),
    backgroundColor: '#FFFFFF',
    titleStyles: commonStyles.darkTitle,
    subtitleStyles: commonStyles.darkSubtitle,
    imageStyles: commonStyles.image,
  },
];