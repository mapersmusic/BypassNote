import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import BPNoteCodec from './lib/bpnote_codec';

// Simple placeholder screen that demonstrates loading the codec
const HomeScreen = () => {
  let codecInfo = 'Codec not loaded';
  try {
    const codec = BPNoteCodec.fromCompiled();
    codecInfo = `Loaded types: ${codec.typeNames.join(', ')}`;
  } catch (e) {
    // In RN environment the compiled protobuf may not be available yet
    codecInfo = (e as Error).message;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BypassNote (React Native)</Text>
      <Text style={styles.info}>{codecInfo}</Text>
    </View>
  );
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f11',
  },
  title: {
    fontSize: 24,
    color: '#e4e4f0',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#a1a1b5',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});
