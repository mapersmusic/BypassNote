import { Pressable, StyleSheet, Text, View } from "react-native";

import { useBpnote } from "@/lib/store";
import { colors, fontFamily, FontSize, radii, Spacing } from "@/styles/global";

/** Bandeau de notification — équivalent des `alert()` de la version web. */
export function StatusBar() {
  const { status, dismissStatus } = useBpnote();

  if (status.kind === "idle") {
    return null;
  }

  const isError = status.kind === "error";

  return (
    <Pressable onPress={dismissStatus} accessibilityRole="button">
      <View style={[styles.bar, isError && styles.barError]}>
        <Text style={[styles.text, isError && styles.textError]} numberOfLines={2}>
          {status.message}
        </Text>
        <Text style={styles.dismiss}>×</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    margin: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
    backgroundColor: "rgba(108, 99, 255, 0.08)",
  },
  barError: {
    borderColor: colors.alert,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: FontSize.small,
    color: colors.textSecondary,
  },
  textError: {
    color: colors.alert,
  },
  dismiss: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});