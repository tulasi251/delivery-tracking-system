import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { OrderCard } from '../components/OrderCard';

export const ManagerDashboard = ({ navigation }) => {
  const {
    user,
    orders,
    logout,
    resetDemoData
  } = useStore();

  const handleTrackOrder = (order) => {
    navigation.navigate('Tracking', { orderId: order.id });
  };

  // Group orders for calculations
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const pickedUpCount = orders.filter(o => o.status === 'Picked Up').length;
  const activeCount = orders.filter(o => o.status === 'In Transit').length;
  const completedCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Top Header Control Center */}
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Ionicons name="shield-half-outline" size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Operations Hub</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>
        
        <View style={styles.actionHeaderGroup}>
          <TouchableOpacity style={styles.resetButton} onPress={resetDemoData} title="Reset Data">
            <Ionicons name="refresh-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary Matrix */}
      <View style={styles.matrixContainer}>
        <View style={styles.matrixRow}>
          <View style={[styles.matrixCard, styles.borderBlue]}>
            <Text style={styles.matrixVal}>{orders.length}</Text>
            <Text style={styles.matrixLabel}>Total Orders</Text>
          </View>
          <View style={[styles.matrixCard, styles.borderYellow]}>
            <Text style={[styles.matrixVal, styles.colorYellow]}>{pendingCount}</Text>
            <Text style={styles.matrixLabel}>Pending</Text>
          </View>
        </View>
        <View style={styles.matrixRow}>
          <View style={[styles.matrixCard, styles.borderPurple]}>
            <Text style={[styles.matrixVal, styles.colorPurple]}>{pickedUpCount + activeCount}</Text>
            <Text style={styles.matrixLabel}>In Transit</Text>
          </View>
          <View style={[styles.matrixCard, styles.borderGreen]}>
            <Text style={[styles.matrixVal, styles.colorGreen]}>{completedCount}</Text>
            <Text style={styles.matrixLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>ALL DELIVERY CONSIGNMENTS</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.orderWrapper}>
            <OrderCard
              order={item}
              role="manager"
              onTrack={handleTrackOrder}
            />
            {/* Live GPS Coordinates banner for manager view */}
            {item.status !== 'Pending' && (
              <View style={styles.liveCoordinatesBox}>
                <View style={styles.coordHeader}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveCoordTitle}>LIVE TELEMETRY COORDINATES</Text>
                </View>
                <Text style={styles.coordValues}>
                  Lat: {item.currentCoordinates.latitude.toFixed(6)} | Lng: {item.currentCoordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionHeaderGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  matrixContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 12,
  },
  matrixCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  borderBlue: { borderLeftColor: '#3B82F6' },
  borderYellow: { borderLeftColor: '#F59E0B' },
  borderPurple: { borderLeftColor: '#8B5CF6' },
  borderGreen: { borderLeftColor: '#10B981' },
  matrixVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  colorYellow: { color: '#D97706' },
  colorPurple: { color: '#7C3AED' },
  colorGreen: { color: '#059669' },
  matrixLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  orderWrapper: {
    marginBottom: 16,
  },
  liveCoordinatesBox: {
    backgroundColor: '#F5F3FF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderTopWidth: 0,
    marginTop: -20, // Overlaps with card bottom border for unified feel
    marginBottom: 12,
    zIndex: -1,
  },
  coordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  liveCoordTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 1,
  },
  coordValues: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 2,
  },
});
