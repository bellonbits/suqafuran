import { View, Text, StyleSheet } from 'react-native';

export default function SellScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sell</Text>
      <Text style={styles.subtitle}>Post Ad flow coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
});
