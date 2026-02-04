import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
} from '@/src/components/ui/nativewind';

export default function UIDemo() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            icon={<Ionicons name="arrow-back" size={20} color="#F46315" />}
          >
            Back
          </Button>
          <Text className="text-xl font-heading font-bold text-primary">
            NativeWind UI Demo
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Button Examples */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button fullWidth>Default Button</Button>
            <Button variant="secondary" fullWidth>
              Secondary Button
            </Button>
            <Button variant="outline" fullWidth>
              Outline Button
            </Button>
            <Button variant="ghost" fullWidth>
              Ghost Button
            </Button>
            <Button variant="destructive" fullWidth>
              Destructive Button
            </Button>
          </CardContent>
        </Card>

        {/* Button Sizes */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Button Sizes</CardTitle>
          </CardHeader>
          <CardContent className="flex-row space-x-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">X-Large</Button>
          </CardContent>
        </Card>

        {/* Input Examples */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
            <CardDescription>Text input variations</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              error={error}
            />
            
            <Input
              label="With Helper Text"
              placeholder="Enter something"
              helperText="This is helper text to guide the user"
            />
          </CardContent>
          <CardFooter>
            <Button
              fullWidth
              onPress={() => {
                if (!email || !password) {
                  setError('Please fill in all fields');
                } else {
                  setError('');
                }
              }}
            >
              Submit Form
            </Button>
          </CardFooter>
        </Card>

        {/* Card Variations */}
        <Card className="mb-4 bg-primary/10">
          <CardHeader>
            <CardTitle>Custom Styled Card</CardTitle>
            <CardDescription>
              Cards can be customized with Tailwind classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Text className="text-text-primary dark:text-text-primary-dark">
              This card has a custom background color using Tailwind's opacity modifier.
              The NativeWind system allows for easy customization while maintaining
              consistency across your app.
            </Text>
          </CardContent>
        </Card>

        {/* Typography Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Typography System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Text className="text-3xl font-heading font-bold text-primary">
              Heading Large
            </Text>
            <Text className="text-2xl font-heading font-semibold text-text-primary dark:text-text-primary-dark">
              Heading Medium
            </Text>
            <Text className="text-xl font-heading font-medium text-text-primary dark:text-text-primary-dark">
              Heading Small
            </Text>
            <Text className="text-base font-body text-text-primary dark:text-text-primary-dark">
              Body text with normal weight
            </Text>
            <Text className="text-sm font-body text-text-secondary dark:text-text-secondary-dark">
              Secondary text with smaller size
            </Text>
            <Text className="text-xs font-body text-text-secondary dark:text-text-secondary-dark">
              Caption text extra small
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}