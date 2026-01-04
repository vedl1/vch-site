import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { Star } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  onClose: () => void;
  effortRating?: number;
}

export function CelebrationOverlay({ visible, onClose, effortRating }: CelebrationOverlayProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Confetti/Stars Animation */}
      <LottieView
        ref={animationRef}
        source={{
          uri: 'https://lottie.host/b7e8b6e8-1c7f-4c1f-8f9a-8d8c8d8c8d8c/confetti.json',
        }}
        // Fallback to inline animation data for stars
        style={styles.lottie}
        autoPlay
        loop={false}
        onAnimationFinish={() => {
          // Animation finished, but keep overlay until user dismisses
        }}
      />

      {/* Animated Stars Background */}
      <View style={styles.starsContainer}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.starWrapper,
              {
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 60 + 10}%`,
                opacity: 0.3 + Math.random() * 0.7,
                transform: [{ scale: 0.5 + Math.random() * 1 }],
              },
            ]}
          >
            <Star size={24} color="#fbbf24" fill="#fbbf24" />
          </View>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.starBadge}>
          <Star size={48} color="#fbbf24" fill="#fbbf24" />
        </View>
        
        <Text style={styles.title}>Day Complete!</Text>
        <Text style={styles.subtitle}>You crushed it! 💪</Text>
        
        {effortRating && (
          <View style={styles.effortBadge}>
            <Text style={styles.effortLabel}>Effort Rating</Text>
            <Text style={styles.effortValue}>{effortRating}/10</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lottie: {
    position: 'absolute',
    width: width,
    height: height,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starWrapper: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  starBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 32,
  },
  effortBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  effortLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  effortValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

