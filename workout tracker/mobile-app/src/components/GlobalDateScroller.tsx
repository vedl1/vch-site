import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useDate } from '../context/DateContext';
import { HEVY_COLORS, HEVY_RADIUS, HEVY_SHADOWS } from './cards/WorkoutCard/constants';

const ITEM_WIDTH = 56;

export function GlobalDateScroller() {
  const { dates, selectedDate, setSelectedDate } = useDate();
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

  // Scroll when selected date changes from external source
  useEffect(() => {
    const selectedIndex = dates.findIndex(d => d.isSelected);
    if (selectedIndex > 0 && flatListRef.current) {
      flatListRef.current?.scrollToIndex({
        index: Math.max(0, selectedIndex - 2),
        animated: true,
      });
    }
  }, [selectedDate]);

  const renderDateItem = ({ item }: { item: typeof dates[0] }) => {
    const isSelected = item.isSelected;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedDate(item.date)}
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

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH + 8,
    offset: (ITEM_WIDTH + 8) * index,
    index,
  });

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
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: HEVY_COLORS.cardBg,
    paddingVertical: 12,
    ...HEVY_SHADOWS.card,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  dateItem: {
    width: ITEM_WIDTH,
    height: 72,
    borderRadius: HEVY_RADIUS.lg,
    backgroundColor: HEVY_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateItemSelected: {
    backgroundColor: HEVY_COLORS.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: HEVY_COLORS.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNameToday: {
    color: HEVY_COLORS.primary,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: HEVY_COLORS.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: HEVY_COLORS.primary,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: HEVY_COLORS.textTertiary,
    marginTop: 4,
  },
  workoutDotComplete: {
    backgroundColor: HEVY_COLORS.success,
  },
});

