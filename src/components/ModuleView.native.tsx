import { Linking, Modal, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "@/styles/global";

import type { ModuleViewProps } from "./module-view-types";

/**
 * Sur mobile, Hermes interdit `new Function()` : le document du module est donc
 * évalué et rendu dans une WebView, qui dispose d'un moteur JavaScript complet.
 */
export function ModuleView({ html, onClose, onBridge }: ModuleViewProps) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <WebView
          source={{ html }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            try {
              onBridge(JSON.parse(event.nativeEvent.data) as Parameters<typeof onBridge>[0]);
            } catch {
              // Message non JSON : ignoré.
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (/^https?:\/\//i.test(request.url)) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
