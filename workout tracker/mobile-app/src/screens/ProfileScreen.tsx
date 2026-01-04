import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Activity,
  Bike,
  Shield,
} from 'lucide-react-native';
import { LinkedActivitiesSection } from '../components/LinkedActivitiesSection';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, label, subtitle, onPress, showChevron = true, rightElement }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 px-5"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-xl bg-dark-700 items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium">{label}</Text>
        {subtitle && (
          <Text className="text-dark-400 text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      {rightElement}
      {showChevron && !rightElement && (
        <ChevronRight size={20} color="#475569" />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-dark-500 text-xs font-semibold uppercase tracking-wide px-5 mt-6 mb-2">
      {title}
    </Text>
  );
}

export function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-dark-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">Profile</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-5 mb-2 bg-dark-800 rounded-2xl p-5 border border-dark-700">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mr-4">
              <User size={32} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Athlete</Text>
              <Text className="text-dark-400 text-sm">12-Week Program</Text>
            </View>
            <TouchableOpacity className="bg-dark-700 px-4 py-2 rounded-xl">
              <Text className="text-white text-sm font-medium">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Services */}
        <SectionHeader title="Connected Services" />
        <View className="bg-dark-800 mx-5 rounded-2xl border border-dark-700">
          <MenuItem
            icon={<Activity size={20} color="#00bcd4" />}
            label="Whoop"
            subtitle="Connected"
            rightElement={
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            }
          />
          <View className="h-px bg-dark-700 mx-5" />
          <MenuItem
            icon={<Bike size={20} color="#fc4c02" />}
            label="Strava"
            subtitle="Connected"
            rightElement={
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            }
          />
        </View>

        {/* Linked Strava Activities */}
        <SectionHeader title="Recent Activities" />
        <View className="mx-5">
          <LinkedActivitiesSection maxActivities={3} showHeader={false} />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View className="bg-dark-800 mx-5 rounded-2xl border border-dark-700">
          <MenuItem
            icon={<Bell size={20} color="#94a3b8" />}
            label="Notifications"
            subtitle="Workout reminders"
          />
          <View className="h-px bg-dark-700 mx-5" />
          <MenuItem
            icon={<Moon size={20} color="#94a3b8" />}
            label="Appearance"
            subtitle="Dark mode"
          />
          <View className="h-px bg-dark-700 mx-5" />
          <MenuItem
            icon={<Settings size={20} color="#94a3b8" />}
            label="Settings"
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View className="bg-dark-800 mx-5 rounded-2xl border border-dark-700">
          <MenuItem
            icon={<HelpCircle size={20} color="#94a3b8" />}
            label="Help & FAQ"
          />
          <View className="h-px bg-dark-700 mx-5" />
          <MenuItem
            icon={<Shield size={20} color="#94a3b8" />}
            label="Privacy Policy"
          />
        </View>

        {/* Logout */}
        <View className="mx-5 mt-6 mb-8">
          <TouchableOpacity 
            className="flex-row items-center justify-center py-4 bg-dark-800 rounded-2xl border border-dark-700"
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-400 font-medium ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text className="text-dark-600 text-xs text-center mb-8">
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

