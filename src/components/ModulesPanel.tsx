import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IconBolt, IconTrash, IconUpload } from "@/components/icons";
import { ModuleView } from "@/components/ModuleView";
import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import { shareCsv } from "@/lib/file-io";
import {
  buildCollectionCsv,
  buildModuleDocument,
  loadInstalledModules,
  openModuleInWindow,
  pickAndReadModule,
  saveInstalledModules,
  type InstalledModule,
  type ModuleBridgeMessage,
} from "@/lib/modules";
import { useBpnote } from "@/lib/store";
import { colors, fontFamily, FontSize, globalStyles, radii, Spacing } from "@/styles/global";

type PanelStatus = { kind: "info" | "error"; message: string };

function asCollection(value: string | undefined, fallback: CollectionId): CollectionId {
  return COLLECTIONS.find((collection) => collection.id === value)?.id ?? fallback;
}

/**
 * Fenêtre « Modules ».
 *
 * Même contrat que l'ancienne version web : installation d'un `.js` ou `.zip`,
 * exécution de `createPage` / `renderPage` / `run`, désinstallation. Le code du
 * module est évalué dans une WebView sur mobile et dans une page Blob sur web.
 */
export function ModulesPanel() {
  const { state, modulesOpen, closeModules } = useBpnote();
  const pathname = usePathname();
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const [status, setStatus] = useState<PanelStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const activeCollection = asCollection(
    pathname.startsWith("/collection/") ? pathname.slice("/collection/".length) : undefined,
    "tricks",
  );

  useEffect(() => {
    let cancelled = false;

    loadInstalledModules()
      .then((installed) => {
        if (!cancelled) {
          setModules(installed);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setStatus({ kind: "error", message: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const install = async () => {
    setBusy(true);
    setStatus(null);

    try {
      const record = await pickAndReadModule();

      if (!record) {
        return;
      }

      if (modules.some((module) => module.id === record.id)) {
        throw new Error(`Un module avec cet identifiant est déjà installé : ${record.id}`);
      }

      const next = [...modules, record];
      await saveInstalledModules(next);
      setModules(next);
      setStatus({ kind: "info", message: `Module installé : ${record.name}` });
    } catch (error) {
      setStatus({
        kind: "error",
        message: `Impossible d'installer le module : ${(error as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const uninstall = (module: InstalledModule) => {
    const remove = async () => {
      try {
        const next = modules.filter((item) => item.id !== module.id);
        await saveInstalledModules(next);
        setModules(next);
        setStatus({ kind: "info", message: `Module désinstallé : ${module.name}` });
      } catch (error) {
        setStatus({
          kind: "error",
          message: `Impossible de désinstaller le module : ${(error as Error).message}`,
        });
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Désinstaller le module "${module.name}" ?`)) {
        void remove();
      }
      return;
    }

    Alert.alert("Désinstaller ?", module.name, [
      { text: "Annuler", style: "cancel" },
      { text: "Désinstaller", style: "destructive", onPress: () => void remove() },
    ]);
  };

  const run = (module: InstalledModule) => {
    try {
      const html = buildModuleDocument(module, state, activeCollection);

      if (Platform.OS === "web") {
        if (!openModuleInWindow(html)) {
          setStatus({
            kind: "error",
            message: "La fenêtre du module a été bloquée par le navigateur.",
          });
        }
        return;
      }

      closeModules();
      setRunning(html);
    } catch (error) {
      setStatus({
        kind: "error",
        message: `Erreur du module : ${(error as Error).message}`,
      });
    }
  };

  const handleBridge = (message: ModuleBridgeMessage) => {
    switch (message.type) {
      case "close":
        setRunning(null);
        break;
      case "open":
        Linking.openURL(message.url).catch(() => {});
        break;
      case "message":
        Alert.alert("Module", message.message);
        break;
      case "exportCsv": {
        const collection = asCollection(message.collection, activeCollection);
        shareCsv(buildCollectionCsv(collection, state), collection).catch((error: Error) => {
          Alert.alert("Export CSV", error.message);
        });
        break;
      }
    }
  };

  return (
    <>
      <Modal visible={modulesOpen} transparent onRequestClose={closeModules}>
        <Pressable style={styles.overlay} onPress={closeModules}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.head}>
              <Text style={globalStyles.cardTitle}>Modules</Text>
              <Pressable
                onPress={closeModules}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.info}>
                Les modules peuvent accéder aux données visibles et générer leurs propres
                pages, exportations ou actions personnalisées.
              </Text>

              {status ? (
                <Text style={[styles.status, status.kind === "error" && styles.statusError]}>
                  {status.message}
                </Text>
              ) : null}

              {modules.length === 0 ? (
                <Text style={styles.empty}>Aucun module installé.</Text>
              ) : (
                modules.map((module) => (
                  <View key={module.id} style={styles.module}>
                    <View style={styles.moduleHead}>
                      <Text style={styles.moduleName}>{module.name}</Text>
                      <Text style={styles.moduleVersion}>v{module.version}</Text>
                    </View>

                    {module.description ? (
                      <Text style={styles.moduleDescription}>{module.description}</Text>
                    ) : null}

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => run(module)}
                        style={[styles.btn, styles.btnPrimary]}
                        accessibilityRole="button"
                        accessibilityLabel={`Exécuter ${module.name}`}
                      >
                        <IconBolt size={14} color={colors.text} />
                        <Text style={styles.btnText}>Exécuter</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => uninstall(module)}
                        style={[styles.btn, styles.btnDanger]}
                        accessibilityRole="button"
                        accessibilityLabel={`Désinstaller ${module.name}`}
                      >
                        <IconTrash size={14} color={colors.alert} />
                        <Text style={[styles.btnText, styles.btnDangerText]}>Désinstaller</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Pressable
                onPress={install}
                disabled={busy}
                style={[styles.install, busy && styles.installDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Installer un module"
              >
                <IconUpload size={16} color={colors.text} />
                <Text style={styles.installText}>
                  {busy ? "Installation…" : "Installer un module (.js ou .zip)"}
                </Text>
              </Pressable>

              <Text style={styles.hint}>
                Pour un paquet .zip, l'archive doit contenir directement manifest.json et
                son entrée à la racine, sans dossier parent.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {running ? (
        <ModuleView
          html={running}
          onClose={() => setRunning(null)}
          onBridge={handleBridge}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.three,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: colors.header,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    padding: Spacing.three,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  close: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: Spacing.two,
  },
  info: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  status: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
  },
  statusError: {
    color: colors.alert,
  },
  empty: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  module: {
    padding: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: Spacing.one,
  },
  moduleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  moduleName: {
    flexShrink: 1,
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  moduleVersion: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  moduleDescription: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: Spacing.two,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  btnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },
  btnDangerText: {
    color: colors.alert,
  },
  install: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.one,
    paddingVertical: 9,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  installDisabled: {
    opacity: 0.6,
  },
  installText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },
  hint: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.micro,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
