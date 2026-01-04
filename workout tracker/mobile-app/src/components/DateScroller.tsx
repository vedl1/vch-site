import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

interface DateItem {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  isComplete: boolean;
}

interface DateScrollerProps {
  dates: DateItem[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const ITEM_WIDTH = 56;

export function DateScroller({ dates, selectedDate, onDateSelect }: DateScrollerProps) {
  const flatListRef = useRef<FlatList>(null);

  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIndex = dates.findIndex(d => d.isSelected);
    if (selectedIndex > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: Math.max(0, selectedIndex - 2),
          animated: true,
        });
      }, 100);
    }
  }, []);

  const renderDateItem = ({ item }: { item: DateItem }) => {
    const isSelected = item.isSelected;
    
    return (
      <TouchableOpacity
        onPress={() => onDateSelect(item.date)}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayName,
          isSelected && styles.dayNameSelected,
          item.isToday && !isSelected && styles.dayNameToday,
        ]}>
          {item.dayName}
        </Text>
        <Text style={[
          styles.dayNumber,
          isSelected && styles.dayNumberSelected,
          item.isToday && !isSelected && styles.dayNumberToday,
        ]}>
          {item.dayNumber}
        </Text>
        
        {/* Workout indicator dot */}
        {item.hasWorkout && !isSelected && (
          <View style={[
            styles.workoutDot,
            item.isComplete && styles.workoutDotComplete,
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.date.toISOString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + 8,
          offset: (ITEM_WIDTH + 8) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
    ...SHADOWS.small,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  dateItem: {
    width: ITEM_WIDTH,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNameToday: {
    color: COLORS.primary,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: COLORS.primary,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textTertiary,
    marginTop: 4,
  },
  workoutDotComplete: {
    backgroundColor: COLORS.success,
  },
});

