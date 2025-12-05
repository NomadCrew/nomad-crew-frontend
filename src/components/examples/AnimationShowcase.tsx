/**
 * Animation Showcase Component
 * Demonstrates the comprehensive animation system with all features
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useComponentUtils, useAnimationUtils } from '../../theme/utils';
import { 
  PresenceIndicator 
} from '../ui/animations/PresenceIndicator';
import { 
  LoadingSpinner, 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonList,
  FadeInView,
  PulseView,
  SlideInView 
} from '../ui/animations/LoadingStates';
import type { PresenceStatus } from '../../theme/types';

export const AnimationShowcase: React.FC = () => {
  const { theme } = useAppTheme();
  const components = useComponentUtils(theme);
  const animations = useAnimationUtils(theme);
  
  // State for interactive demos
  const [buttonPressed, setButtonPressed] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [showLoadingContent, setShowLoadingContent] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const presenceStatuses: PresenceStatus[] = ['online', 'away', 'busy', 'offline', 'typing'];

  return (
    <ScrollView style={components.list.getListContainerStyle()}>
      <View style={{ padding: 16, gap: 24 }}>
        
        {/* Header */}
        <View style={components.card.getCardStyle('elevated')}>
          <Text style={components.card.getCardTitleStyle()}>
            Animation System Showcase
          </Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8 }}>
            Complete animation system with micro-interactions, presence indicators, and loading states
          </Text>
        </View>

        {/* Presence Indicators */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Presence Indicators</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
            Animated status indicators with pulse effects and smooth transitions
          </Text>
          
          <View style={{ gap: 16 }}>
            {presenceStatuses.map((status) => (
              <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <PresenceIndicator 
                  status={status} 
                  size={12} 
                  showPulse={status === 'online'} 
                />
                <Text style={{ color: theme.colors.content.primary, flex: 1 }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {status === 'online' && (
                  <Text style={{ color: theme.colors.content.tertiary, fontSize: 12 }}>
                    (with pulse)
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Micro-Interactions */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Micro-Interactions</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
            Interactive button and card animations with haptic feedback
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Interactive Button */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setButtonPressed(true)}
              onPressOut={() => setButtonPressed(false)}
              style={[
                components.button.getButtonStyle('primary', 'md'),
                animations.createButtonPressStyle(buttonPressed),
              ]}
            >
              <Text style={{ color: theme.colors.primary.text }}>
                Press and Hold Me
              </Text>
            </TouchableOpacity>

            {/* Interactive Card */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setCardHovered(true)}
              onPressOut={() => setCardHovered(false)}
              style={[
                components.card.getCardStyle('default'),
                animations.createCardHoverStyle(cardHovered),
                { padding: 16 }
              ]}
            >
              <Text style={{ color: theme.colors.content.primary }}>
                Interactive Card
              </Text>
              <Text style={{ color: theme.colors.content.secondary, fontSize: 12, marginTop: 4 }}>
                Touch to see hover animation
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading States */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Loading States</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
            Spinners, skeletons, and shimmer effects for loading experiences
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Spinner */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LoadingSpinner size={20} />
              <Text style={{ color: theme.colors.content.primary }}>Loading Spinner</Text>
            </View>

            {/* Skeleton Text */}
            <View>
              <Text style={{ color: theme.colors.content.primary, marginBottom: 8 }}>
                Skeleton Text:
              </Text>
              <SkeletonText lines={3} lastLineWidth="70%" />
            </View>

            {/* Skeleton Card */}
            <View>
              <Text style={{ color: theme.colors.content.primary, marginBottom: 8 }}>
                Skeleton Card:
              </Text>
              <SkeletonCard />
            </View>

            {/* Toggle Loading Content */}
            <TouchableOpacity
              onPress={() => setShowLoadingContent(!showLoadingContent)}
              style={components.button.getButtonStyle('secondary', 'sm')}
            >
              <Text style={{ color: theme.colors.content.primary }}>
                {showLoadingContent ? 'Show Skeleton' : 'Show Content'}
              </Text>
            </TouchableOpacity>

            {showLoadingContent ? (
              <FadeInView duration={300}>
                <View style={components.card.getCardStyle('default')}>
                  <Text style={components.card.getCardTitleStyle()}>
                    Loaded Content
                  </Text>
                  <Text style={{ color: theme.colors.content.secondary, marginTop: 8 }}>
                    This content faded in smoothly after loading completed.
                  </Text>
                </View>
              </FadeInView>
            ) : (
              <SkeletonCard showAvatar={true} showButton={true} />
            )}
          </View>
        </View>

        {/* Transition Animations */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Transition Animations</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
            Smooth entrance and transition effects
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Tab Animation Demo */}
            <View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['Fade In', 'Slide Up', 'Slide Left'].map((tab, index) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setSelectedTab(index)}
                    style={[
                      components.button.getButtonStyle(
                        selectedTab === index ? 'primary' : 'outlined', 
                        'sm'
                      ),
                    ]}
                  >
                    <Text style={{ 
                      color: selectedTab === index 
                        ? theme.colors.primary.text 
                        : theme.colors.primary.main 
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Animated Content */}
              {selectedTab === 0 && (
                <FadeInView key="fade" duration={400}>
                  <View style={[components.card.getCardStyle('default'), { padding: 16 }]}>
                    <Text style={{ color: theme.colors.content.primary }}>
                      ✨ Fade In Animation
                    </Text>
                    <Text style={{ color: theme.colors.content.secondary, marginTop: 4 }}>
                      Smooth opacity transition
                    </Text>
                  </View>
                </FadeInView>
              )}

              {selectedTab === 1 && (
                <SlideInView key="slide-up" direction="up" duration={400}>
                  <View style={[components.card.getCardStyle('default'), { padding: 16 }]}>
                    <Text style={{ color: theme.colors.content.primary }}>
                      ⬆️ Slide Up Animation
                    </Text>
                    <Text style={{ color: theme.colors.content.secondary, marginTop: 4 }}>
                      Slides in from bottom
                    </Text>
                  </View>
                </SlideInView>
              )}

              {selectedTab === 2 && (
                <SlideInView key="slide-left" direction="left" duration={400}>
                  <View style={[components.card.getCardStyle('default'), { padding: 16 }]}>
                    <Text style={{ color: theme.colors.content.primary }}>
                      ⬅️ Slide Left Animation
                    </Text>
                    <Text style={{ color: theme.colors.content.secondary, marginTop: 4 }}>
                      Slides in from right
                    </Text>
                  </View>
                </SlideInView>
              )}
            </View>
          </View>
        </View>

        {/* Continuous Animations */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Continuous Animations</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
            Pulse and breathing effects for ongoing states
          </Text>
          
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <PulseView scale={1.1} duration={1500}>
                <View style={[
                  components.card.getCardStyle('elevated'),
                  { padding: 12, alignItems: 'center' }
                ]}>
                  <Text style={{ color: theme.colors.content.primary, fontSize: 12 }}>
                    Pulse Effect
                  </Text>
                </View>
              </PulseView>

              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.content.primary }}>
                  Pulsing Animation
                </Text>
                <Text style={{ color: theme.colors.content.secondary, fontSize: 12 }}>
                  Continuous gentle pulse effect
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Notes */}
        <View style={components.card.getCardStyle('elevated')}>
          <Text style={components.card.getCardTitleStyle()}>Performance Features</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8, lineHeight: 20 }}>
            • All animations use native driver for 60fps performance{'\n'}
            • Theme-aware colors adapt to light/dark mode{'\n'}
            • Configurable durations and easing curves{'\n'}
            • Accessibility-friendly with reduced motion support{'\n'}
            • Memory efficient with proper cleanup on unmount
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}; 