import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dumbbell, History, BarChart3, User, Play } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { StartWorkoutScreen } from '../screens/StartWorkoutScreen';
import { HistoryScreenNew } from '../screens/HistoryScreenNew';
import { StatisticsScreenNew } from '../screens/StatisticsScreenNew';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';
import { HEVY_COLORS } from '../components/cards/WorkoutCard/constants';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  icon: React.ComponentType<{ size: number; color: string }>;
}

function TabIcon({ focused, icon: Icon }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Icon size={24} color={focused ? HEVY_COLORS.primary : HEVY_COLORS.textSecondary} />
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: HEVY_COLORS.cardBg,
          borderTopColor: HEVY_COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarActiveTintColor: HEVY_COLORS.primary,
        tabBarInactiveTintColor: HEVY_COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={Dumbbell} />,
        }}
      />
      <Tab.Screen
        name="Start"
        component={StartWorkoutScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={Play} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreenNew}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={History} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatisticsScreenNew}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={BarChart3} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={User} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: HEVY_COLORS.primary,
    marginTop: 4,
  },
});

