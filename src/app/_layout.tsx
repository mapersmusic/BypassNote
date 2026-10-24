// Imports par sous-chemin plutôt que depuis le barrel du paquet : le barrel
// `require()` les 32 fichiers .ttf de la famille, ce qui embarquait ~4,7 Mo de
// graisses inutilisées dans le bundle web. Seules celles listées ici sont
// référencées par `fontFamily` (src/styles/global.tsx).
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans/500Medium";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { useFonts } from "expo-font";
import { Stack, router, usePathname } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ExportPanel } from "../components/ExportPanel";
import { HexPanel } from "../components/HexPanel";
import {
  IconDownload,
  IconShape,
  IconTerminal2,
  IconUpload,
} from "../components/icons";
import { ModulesPanel } from "../components/ModulesPanel";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { StatusBar } from "../components/StatusBar";
import {
  collectionHref,
  findCollection,
  type CollectionId,
} from "../constants/collections";
import { useIsCompact, useIsWide } from "../hooks/use-breakpoint";
import {
  countCollectionItems,
  countSelectedCollectionItems,
  createExportSelection,
  selectAllItems,
  setCollectionSelected,
  toggleExportItem,
  type ExportSelection,
} from "../lib/export-selection";
import { BpnoteProvider, useBpnote } from "../lib/store";
import { colors, fontFamily } from "../styles/global";

export default function RootLayout() {
  // IBM Plex Sans + JetBrains Mono, comme dans la version web d'origine.
  useFonts({
    [fontFamily.sans]: IBMPlexSans_400Regular,
    [fontFamily.sansMedium]: IBMPlexSans_500Medium,
    [fontFamily.sansSemiBold]: IBMPlexSans_600SemiBold,
    [fontFamily.mono]: JetBrainsMono_400Regular,
    [fontFamily.monoMedium]: JetBrainsMono_500Medium,
  });

  return (
    <BpnoteProvider>
      <Shell />
    </BpnoteProvider>
  );
}

function Shell() {
  const pathname = usePathname();
  const isWide = useIsWide();
  const isCompact = useIsCompact();
  const {
    state,
    counts,
    autosave,
    hexOpen,
    exportOpen,
    toggleHex,
    openModules,
    openExport,
    closeExport,
    importBpnote,
    exportBpnote,
  } = useBpnote();

  // La sélection est recalculée à chaque ouverture : les lignes ont pu changer
  // (ajout, suppression, import) entre deux exports.
  const [exportSelection, setExportSelection] = useState<ExportSelection>(() =>
    createExportSelection(state),
  );

  const openExportPanel = () => {
    setExportSelection(createExportSelection(state));
    openExport();
  };

  const toggleExportItemAt = (id: CollectionId, index: number) => {
    setExportSelection((previous) =>
      toggleExportItem(previous, id, index, countCollectionItems(state, id)),
    );
  };

  const toggleExportCollection = (id: CollectionId) => {
    const total = countCollectionItems(state, id);
    const selected = countSelectedCollectionItems(state, exportSelection, id);

    setExportSelection((previous) =>
      setCollectionSelected(previous, id, total, selected !== total),
    );
  };

  const runExport = () => {
    void exportBpnote(exportSelection);
    closeExport();
  };

  const activeCollection = findCollection(
    pathname.startsWith("/collection/") ? pathname.slice("/collection/".length) : null,
  );

  const goToCollection = (id: CollectionId) => {
    router.push(collectionHref(id));
  };

  return (
    <View style={styles.root}>
      <Navbar
        activeCollectionId={activeCollection?.id}
        onSelectCollection={goToCollection}
        autosave={autosave}
        actions={[
          { key: "hex", label: "Hex", icon: IconTerminal2, onPress: toggleHex },
          { key: "import", label: "Importer .bpnote", icon: IconUpload, onPress: importBpnote },
          { key: "modules", label: "Modules", icon: IconShape, onPress: openModules },
          { key: "export", label: "Exporter .bpnote", icon: IconDownload, variant: "primary", onPress: openExportPanel },
        ]}
      />

      <StatusBar />
      {hexOpen ? <HexPanel /> : null}

      {/* `.layout` — colonne sous 960 px, ligne au-delà ; la barre latérale
          disparaît sous 640 px et le burger prend le relais. */}
      <View style={[styles.layout, isWide ? styles.layoutRow : styles.layoutColumn]}>
        {!isCompact ? (
          <Sidebar
            layout={isWide ? "rail" : "grid"}
            activeId={activeCollection?.id}
            counts={counts}
            onSelect={goToCollection}
          />
        ) : null}

        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </View>

      <ModulesPanel />

      <ExportPanel
        visible={exportOpen}
        state={state}
        selection={exportSelection}
        onToggleItem={toggleExportItemAt}
        onToggleCollection={toggleExportCollection}
        onSelectAll={() => setExportSelection(createExportSelection(state))}
        onSelectNone={() => setExportSelection(selectAllItems(state, false))}
        onClose={closeExport}
        onExport={runExport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  layout: {
    flex: 1,
  },
  layoutRow: {
    flexDirection: "row",
  },
  layoutColumn: {
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
});