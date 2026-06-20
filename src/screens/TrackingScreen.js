import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { MapView } from '../components/MapView';
import { StatusBadge } from '../components/StatusBadge';

export const TrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const orders = useStore((state) => state.orders);
  
  // Find the requested order from state
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButtonText} onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { customerName, address, status, startCoordinates, endCoordinates, currentCoordinates } = order;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Interactive Map */}
      <MapView
        startLocation={startCoordinates}
        destinationLocation={endCoordinates}
        driverLocation={currentCoordinates}
        orderStatus={status}
      />

      {/* Floating Back Action */}
      <TouchableOpacity
        style={styles.floatingBackButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back-outline" size={24} color="#1E1B4B" />
      </TouchableOpacity>

      {/* Floating telemetry panel */}
      <View style={styles.bottomCardContainer}>
        <View style={styles.card}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View>
              <Text style={styles.orderLabel}>SHIPMENT TRACKING</Text>
              <Text style={styles.orderId}>{orderId}</Text>
            </View>
            <StatusBadge status={status} />
          </View>

          <View style={styles.divider} />

          {/* Delivery progress stats */}
          <View style={styles.detailSection}>
            <View style={styles.metaRow}>
              <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Customer</Text>
                <Text style={styles.metaValue}>{customerName}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="map-outline" size={20} color="#6B7280" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Destination Address</Text>
                <Text style={styles.metaValue} numberOfLines={2}>{address}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="locate-outline" size={20} color="#7C3AED" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Courier Coordinates</Text>
                <Text style={styles.coordinatesText}>
                  {currentCoordinates.latitude.toFixed(6)}, {currentCoordinates.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  detailSection: {
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  coordinatesText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  backButtonText: {
    padding: 10,
  },
  backLink: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 16,
  },
});
