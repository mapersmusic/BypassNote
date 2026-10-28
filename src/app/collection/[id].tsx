import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text } from "react-native";

import { findCollection } from "@/constants/collections";
import type { Row } from "@/constants/schema";
import { CollectionTable } from "@/components/CollectionTable";
import { EntityForm } from "@/components/EntityForm";
import { useBpnote } from "@/lib/store";
import { colors, fontFamily, FontSize, globalStyles, Spacing } from "@/styles/global";

/** `Alert` n'existe pas dans react-native-web : on y retombe sur `confirm`. */
function confirmDelete(id: number, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`Supprimer l'élément #${id} ?`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert("Supprimer ?", `Élément #${id}`, [
    { text: "Annuler", style: "cancel" },
    { text: "Supprimer", style: "destructive", onPress: onConfirm },
  ]);
}

/** Écran d'une collection — table d'édition, comme un onglet de l'ancienne version web. */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { files, addItem, updateItem, deleteItem } = useBpnote();
  const collection = findCollection(id);

  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  if (!collection) {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.empty}>Collection inconnue</Text>
      </ScrollView>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: Row) => {
    setEditing(item);
    setFormOpen(true);
  };

  const submit = (values: Record<string, unknown>) => {
    if (editing?.id !== undefined) {
      updateItem(collection.id, editing.id, values);
    } else {
      addItem(collection.id, values);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const remove = (item: Row) => {
    confirmDelete(Number(item.id), () => deleteItem(collection.id, Number(item.id)));
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <CollectionTable
        collection={collection}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={remove}
      />

      {files.length > 0 ? (
        <Text style={styles.files}>Sources : {files.join(", ")}</Text>
      ) : null}

      <EntityForm
        visible={formOpen}
        collection={collection.id}
        title={`${editing ? "Éditer" : "Ajouter"} — ${collection.label}`}
        item={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.five,
  },
  files: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
    marginTop: Spacing.two,
  },
});