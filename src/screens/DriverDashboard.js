import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { OrderCard } from '../components/OrderCard';
import { startGPSSimulation, stopGPSSimulation } from '../services/trackingService';

export const DriverDashboard = ({ navigation }) => {
  const {
    user,
    orders,
    activeOrderId,
    isTracking,
    logout,
    acceptOrder,
    updateOrderStatus
  } = useStore();

  // Sync GPS simulation with store's tracking state
  useEffect(() => {
    if (isTracking && activeOrderId) {
      startGPSSimulation(activeOrderId);
    } else {
      stopGPSSimulation();
    }
  }, [isTracking, activeOrderId]);

  const handleAcceptOrder = (orderId) => {
    acceptOrder(orderId);
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleTrackOrder = (order) => {
    navigation.navigate('Tracking', { orderId: order.id });
  };

  // Group orders for presentation
  const activeOrder = orders.find(o => o.id === activeOrderId);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const pastOrders = orders.filter(o => o.status === 'Delivered');

  // Stats computation
  const activeCount = activeOrder ? 1 : 0;
  const completedCount = pastOrders.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Top Header Profile */}
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Ionicons name="car" size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Delivery Partner</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, styles.bgAccent]}>
          <Ionicons name="cube-outline" size={22} color="#7C3AED" />
          <Text style={styles.statsNum}>{activeCount}</Text>
          <Text style={styles.statsLabel}>Active Job</Text>
        </View>

        <View style={[styles.statsCard, styles.bgSuccess]}>
          <Ionicons name="checkmark-done-circle-outline" size={22} color="#059669" />
          <Text style={styles.statsNum}>{completedCount}</Text>
          <Text style={styles.statsLabel}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={pendingOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {/* Active Assignment Section */}
            {activeOrder && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVE ASSIGNMENT</Text>
                <OrderCard
                  order={activeOrder}
                  role="driver"
                  onUpdateStatus={handleUpdateStatus}
                  onTrack={handleTrackOrder}
                />
              </View>
            )}

            {/* Available Orders Section Header */}
            <Text style={styles.sectionTitle}>AVAILABLE JOBS ({pendingOrders.length})</Text>
            {pendingOrders.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No pending delivery jobs available.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            role="driver"
            onAccept={handleAcceptOrder}
          />
        )}
        ListFooterComponent={
          pastOrders.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>COMPLETED HISTORY</Text>
              {pastOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  role="driver"
                />
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light modern background
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
    backgroundColor: '#7C3AED',
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  bgAccent: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  bgSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statsNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 14,
  },
});
