import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Vibration } from 'react-native';
import { X, Plus, Minus, SkipForward } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

interface RestTimerModalProps {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
  onComplete: () => void;
}

export function RestTimerModal({
  visible,
  initialSeconds,
  onClose,
  onComplete,
}: RestTimerModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (visible && isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            Vibration.vibrate([0, 200, 100, 200]);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, isRunning, secondsLeft]);

  const addTime = (seconds: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + seconds));
    setTotalSeconds((prev) => Math.max(0, prev + seconds));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-dark-950/95 items-center justify-center px-8">
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-16 right-6 w-12 h-12 rounded-full bg-dark-800 items-center justify-center"
          activeOpacity={0.7}
        >
          <X size={24} color="#94a3b8" />
        </TouchableOpacity>

        <Text className="text-dark-400 text-lg mb-8">Rest Timer</Text>

        {/* Circular Progress */}
        <View className="items-center justify-center mb-8">
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#22c55e"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          
          <View className="absolute items-center">
            <Text className="text-white text-5xl font-bold font-mono">
              {formatTime(secondsLeft)}
            </Text>
            <Text className="text-dark-500 text-sm mt-2">remaining</Text>
          </View>
        </View>

        {/* Time Adjustment */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={() => addTime(-15)}
            className="w-14 h-14 rounded-full bg-dark-800 items-center justify-center mx-3"
            activeOpacity={0.7}
          >
            <Minus size={24} color="#ef4444" />
          </TouchableOpacity>

          <Text className="text-dark-400 text-sm mx-2">15s</Text>

          <TouchableOpacity
            onPress={() => addTime(15)}
            className="w-14 h-14 rounded-full bg-dark-800 items-center justify-center mx-3"
            activeOpacity={0.7}
          >
            <Plus size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={onComplete}
          className="flex-row items-center bg-dark-800 px-6 py-3 rounded-xl"
          activeOpacity={0.7}
        >
          <SkipForward size={20} color="#94a3b8" />
          <Text className="text-dark-300 font-medium ml-2">Skip Rest</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

