import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';

export const OrderCard = ({ order, role, onAccept, onUpdateStatus, onTrack }) => {
  const { id, customerName, address, status } = order;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderLabel}>ORDER REF</Text>
          <Text style={styles.orderId}>{id}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.icon} />
          <View>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{customerName}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{address}</Text>
          </View>
        </View>
      </View>

      {/* Role-based action buttons */}
      {role === 'driver' && (
        <View style={styles.actionsContainer}>
          {status === 'Pending' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => onAccept(id)}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Accept Order</Text>
            </TouchableOpacity>
          )}

          {status === 'Picked Up' && (
            <TouchableOpacity style={styles.accentButton} onPress={() => onUpdateStatus(id, 'In Transit')}>
              <Ionicons name="bicycle-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Start Delivery</Text>
            </TouchableOpacity>
          )}

          {status === 'In Transit' && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.trackButton} onPress={() => onTrack(order)}>
                <Ionicons name="map-outline" size={18} color="#7C3AED" style={styles.buttonIcon} />
                <Text style={styles.trackButtonText}>Track Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successButton} onPress={() => onUpdateStatus(id, 'Delivered')}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'Delivered' && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-done-outline" size={18} color="#059669" style={styles.bannerIcon} />
              <Text style={styles.completedText}>Delivery Completed</Text>
            </View>
          )}
        </View>
      )}

      {role === 'manager' && (
        <View style={styles.actionsContainer}>
          {(status === 'In Transit' || status === 'Picked Up') ? (
            <TouchableOpacity style={styles.trackButtonFull} onPress={() => onTrack(order)}>
              <Ionicons name="eye-outline" size={18} color="#7C3AED" style={styles.buttonIcon} />
              <Text style={styles.trackButtonText}>Monitor Live Vehicle</Text>
            </TouchableOpacity>
          ) : status === 'Delivered' ? (
            <View style={styles.completedBanner}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#059669" style={styles.bannerIcon} />
              <Text style={styles.completedText}>Delivered & Archived</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.disabledButton} disabled={true}>
              <Ionicons name="hourglass-outline" size={18} color="#9CA3AF" style={styles.buttonIcon} />
              <Text style={styles.disabledButtonText}>Awaiting Driver Acceptance</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#1E1B4B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  accentButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  successButton: {
    flex: 1,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  trackButtonFull: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  trackButtonText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 6,
  },
  completedBanner: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerIcon: {
    marginRight: 6,
  },
  completedText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
  },
});
