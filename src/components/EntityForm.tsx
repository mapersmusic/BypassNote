import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { CollectionId } from "@/constants/collections";
import {
  FIELDS,
  MODE_LABELS,
  TONIC_LABELS,
  type Field,
  type Row,
} from "@/constants/schema";
import { useBpnote } from "@/lib/store";
import { useTapTempo } from "@/hooks/use-tap-tempo";
import { colors, fontFamily, FontSize, globalStyles, radii, Spacing } from "@/styles/global";

type Props = {
  visible: boolean;
  collection: CollectionId;
  title: string;
  /** `null` en mode création. */
  item: Row | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
};

type Draft = Record<string, string>;

function toDraft(item: Row | null): Draft {
  if (!item) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key,
      value === null || value === undefined ? "" : String(value),
    ]),
  );
}

/** Formulaire d'ajout / d'édition — équivalent de `buildForm()` + `readForm()`. */
export function EntityForm({ visible, collection, title, item, onClose, onSubmit }: Props) {
  const { state } = useBpnote();
  const [draft, setDraft] = useState<Draft>(() => toDraft(item));
  const [key, setKey] = useState<[Draft, Draft]>(() => [toDraft(item), toDraft(item)]);

  // Réinitialise le brouillon à chaque ouverture.
  const [lastItem, setLastItem] = useState(item);
  if (visible && lastItem !== item) {
    setLastItem(item);
    setDraft(toDraft(item));
    setKey([toDraft(item), toDraft(item)]);
  }

  const set = (name: string, value: string) => setDraft((prev) => ({ ...prev, [name]: value }));

  const submit = () => {
    const values: Record<string, unknown> = {};

    for (const field of FIELDS[collection]) {
      values[field.name] = readField(field, draft, key);
    }

    onSubmit(values);
  };

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.head}>
            <Text style={globalStyles.cardTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fermer">
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {FIELDS[collection].map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={draft[field.name] ?? ""}
                keyPair={key}
                onChange={(value) => set(field.name, value)}
                onKeyChange={setKey}
              />
            ))}
          </ScrollView>

          <View style={styles.foot}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
              <Text style={styles.btnText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={submit} style={[styles.btn, styles.btnPrimary]} accessibilityRole="button">
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Sauvegarder</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function readField(
  field: Field,
  draft: Draft,
  key: [Draft, Draft],
): unknown {
  if (field.kind === "key") {
    return key[0].tonic && key[0].mode
      ? { tonic: Number(key[0].tonic), mode: Number(key[0].mode) }
      : undefined;
  }

  if (field.kind === "number" || field.kind === "timestamp" || field.kind === "select") {
    return Number(draft[field.name] ?? 0) || 0;
  }

  return draft[field.name] ?? "";
}

type FieldInputProps = {
  field: Field;
  value: string;
  keyPair: [Draft, Draft];
  onChange: (value: string) => void;
  onKeyChange: (pair: [Draft, Draft]) => void;
};

function FieldInput({ field, value, keyPair, onChange, onKeyChange }: FieldInputProps) {
  const { state } = useBpnote();
  const [tonic, mode] = keyPair;
  const tapTempo = useTapTempo((bpm) => onChange(String(bpm)));

  if (field.kind === "select") {
    const options = field.options?.(state) ?? [];

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.chips}>
          {field.optional ? (
            <Chip
              label="— Aucun —"
              active={value === "" || value === "0"}
              onPress={() => onChange("")}
            />
          ) : null}
          {options.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={value === option.value}
              onPress={() => onChange(option.value)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (field.kind === "key") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.chips}>
          <Chip
            label="— Aucune —"
            active={!tonic.tonic}
            onPress={() => onKeyChange([{}, {}])}
          />
        </View>
        <View style={styles.keyRow}>
          <Select
            label="Tonique"
            value={tonic.tonic ?? ""}
            emptyLabel="—"
            options={Object.entries(TONIC_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            onChange={(v) => onKeyChange([{ ...tonic, tonic: v }, { ...mode, mode: mode.mode ?? "" }])}
          />
          <Select
            label="Mode"
            value={mode.mode ?? ""}
            emptyLabel="—"
            options={Object.entries(MODE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            onChange={(v) => onKeyChange([{ ...tonic, tonic: tonic.tonic ?? "" }, { ...mode, mode: v }])}
          />
        </View>
      </View>
    );
  }

  const multiline = field.kind === "textarea";

  const input = (
    <TextInput
      value={value}
      onChangeText={onChange}
      style={[styles.input, field.tapTempo && styles.bpmInput, multiline && styles.inputMultiline]}
      placeholder={field.label}
      placeholderTextColor={colors.textMuted}
      keyboardType={field.kind === "number" || field.kind === "timestamp" ? "numeric" : "default"}
      multiline={multiline}
    />
  );

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      {field.tapTempo ? (
        <View style={styles.bpmRow}>
          {input}
          <Pressable
            onPress={tapTempo}
            style={({ pressed }) => [styles.tapBtn, pressed && styles.tapBtnActive]}
            accessibilityRole="button"
            accessibilityLabel="Tap tempo"
          >
            <Text style={styles.tapBtnText}>Tap Tempo</Text>
          </Pressable>
        </View>
      ) : (
        input
      )}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Select({
  label,
  value,
  emptyLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  emptyLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);

  return (
    <View style={styles.selectWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={styles.input}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.selectValue} numberOfLines={1}>
          {current?.label ?? emptyLabel}
        </Text>
      </Pressable>

      {open ? (
        <ScrollView style={styles.selectList} nestedScrollEnabled>
          {[{ value: "", label: emptyLabel }, ...options].map((option) => (
            <Pressable key={option.value || "__empty"} onPress={() => { onChange(option.value); setOpen(false); }} style={styles.selectOption}>
              <Text style={styles.selectValue} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
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
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: colors.header,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    padding: Spacing.three,
  },
  foot: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },
  btnTextPrimary: {
    color: colors.text,
  },

  field: {
    marginBottom: Spacing.three,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.textSecondary,
    marginBottom: Spacing.one,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  /** BPM : champ + bouton Tap Tempo sur la même ligne. */
  bpmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  bpmInput: {
    flex: 1,
  },
  tapBtn: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  tapBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tapBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    maxWidth: "100%",
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.small,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.sansMedium,
  },
  keyRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  selectWrap: {
    flex: 1,
  },
  selectList: {
    maxHeight: 160,
    marginTop: Spacing.one,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
  },
  selectOption: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  selectValue: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.text,
  },
});