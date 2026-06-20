import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatusBadge = ({ status }) => {
  let badgeStyle = styles.pendingBadge;
  let textStyle = styles.pendingText;

  switch (status) {
    case 'Pending':
      badgeStyle = styles.pendingBadge;
      textStyle = styles.pendingText;
      break;
    case 'Picked Up':
      badgeStyle = styles.pickedUpBadge;
      textStyle = styles.pickedUpText;
      break;
    case 'In Transit':
      badgeStyle = styles.inTransitBadge;
      textStyle = styles.inTransitText;
      break;
    case 'Delivered':
      badgeStyle = styles.deliveredBadge;
      textStyle = styles.deliveredText;
      break;
  }

  return (
    <View style={[styles.container, badgeStyle]}>
      <Text style={[styles.text, textStyle]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  pendingText: {
    color: '#D97706',
  },
  pickedUpBadge: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  pickedUpText: {
    color: '#2563EB',
  },
  inTransitBadge: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C084FC',
  },
  inTransitText: {
    color: '#7C3AED',
  },
  deliveredBadge: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  deliveredText: {
    color: '#059669',
  },
});
