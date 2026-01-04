import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, X } from 'lucide-react-native';

interface EffortRatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

export function EffortRatingModal({ visible, onClose, onSubmit }: EffortRatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(7);

  const handleSubmit = () => {
    onSubmit(selectedRating);
  };

  const getRatingLabel = (rating: number) => {
    if (rating <= 3) return 'Easy day';
    if (rating <= 5) return 'Moderate effort';
    if (rating <= 7) return 'Solid workout';
    if (rating <= 9) return 'Pushed hard';
    return 'All out! 🔥';
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return '#22c55e';
    if (rating <= 5) return '#84cc16';
    if (rating <= 7) return '#eab308';
    if (rating <= 9) return '#f97316';
    return '#ef4444';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate Your Effort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Rating Display */}
          <View style={styles.ratingDisplay}>
            <Text style={[styles.ratingNumber, { color: getRatingColor(selectedRating) }]}>
              {selectedRating}
            </Text>
            <Text style={styles.ratingLabel}>{getRatingLabel(selectedRating)}</Text>
          </View>

          {/* Rating Buttons */}
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  selectedRating === num && { 
                    backgroundColor: getRatingColor(num),
                    borderColor: getRatingColor(num),
                  },
                ]}
                onPress={() => setSelectedRating(num)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    selectedRating === num && styles.ratingButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Star size={20} color="#ffffff" fill="#ffffff" />
            <Text style={styles.submitButtonText}>Complete Day</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  ratingDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingNumber: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  ratingButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  ratingButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

