import { ScrollView, StyleSheet, Text } from "react-native";

import { colors, fontFamily, globalStyles } from "../styles/global";

export default function HomeScreen() {
  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heroTitle}>BypassNote</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
  hero: {
    paddingTop: 32,
    paddingBottom: 8,
  },
  heroTitle: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 38,
    lineHeight: 44,
    color: colors.text,
  },
  heroTagline: {
    marginTop: 14,
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    color: colors.primary,
  },
  paragraph: {
    marginTop: 20,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  paragraphFirst: {
    marginTop: 24,
  },
});