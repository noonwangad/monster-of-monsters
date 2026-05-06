import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { BloodDivider } from "@/components/BloodDivider";

function formatDate(ts: number | null): string {
  if (!ts) return "— EMPTY —";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VHSShelf() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, saveGame, loadGame } = useGame();
  const [saving, setSaving] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = (slotId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(slotId);
    Alert.alert(
      "SAVE GAME",
      `Overwrite SLOT ${slotId}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setSaving(null) },
        {
          text: "Save",
          style: "destructive",
          onPress: async () => {
            await saveGame(slotId);
            setSaving(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleLoad = (slotId: number) => {
    const slot = state.saveSlots.find((s) => s.id === slotId);
    if (!slot || slot.timestamp === null) {
      handleSave(slotId);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "LOAD GAME",
      `Continue from SLOT ${slotId}?\n${formatDate(slot.timestamp)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: async () => {
            await loadGame(slotId);
            router.push("/");
          },
        },
      ]
    );
  };

  const currentMission = state.missions[state.currentMission];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require("@/assets/images/vhs-bg.png")}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.25 }}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,5,0,0.75)" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 10, paddingBottom: botPad + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.storeHeader}>
          <Text style={[styles.storeName, { color: colors.neon }]}>
            ◉ NIGHTMARE VIDEO
          </Text>
          <Text style={[styles.storeTagline, { color: colors.mutedForeground }]}>
            OPEN LATE — ALWAYS OPEN
          </Text>
        </View>

        <BloodDivider color={colors.blood} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SAVE FILES
        </Text>

        <View style={styles.shelfRow}>
          {state.saveSlots.map((slot) => (
            <VHSTape
              key={slot.id}
              slot={slot}
              missions={state.missions}
              onLoad={handleLoad}
              onSave={handleSave}
              isSaving={saving === slot.id}
              colors={colors}
            />
          ))}
        </View>

        <BloodDivider color={colors.blood} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          CURRENT HUNT
        </Text>

        {currentMission && (
          <Pressable
            style={[styles.missionPreview, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => router.push(`/dossier/${currentMission.id}` as any)}
          >
            <View style={styles.missionPreviewContent}>
              <View>
                <Text style={[styles.missionTitle, { color: colors.foreground }]}>
                  {currentMission.title}
                </Text>
                <Text style={[styles.missionLocation, { color: colors.mutedForeground }]}>
                  {currentMission.location}
                </Text>
              </View>
              <View style={[styles.threatBadge, { backgroundColor: colors.blood }]}>
                <Text style={[styles.threatText, { color: colors.foreground }]}>
                  {currentMission.threat}
                </Text>
              </View>
            </View>
            <View style={styles.missionAction}>
              <Feather name="arrow-right" size={16} color={colors.primary} />
              <Text style={[styles.missionActionText, { color: colors.primary }]}>
                VIEW DOSSIER
              </Text>
            </View>
          </Pressable>
        )}

        <Pressable
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>MAIN MENU</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

interface VHSTapeProps {
  slot: ReturnType<typeof useGame>["state"]["saveSlots"][0];
  missions: ReturnType<typeof useGame>["state"]["missions"];
  onLoad: (id: number) => void;
  onSave: (id: number) => void;
  isSaving: boolean;
  colors: ReturnType<typeof useColors>;
}

function VHSTape({ slot, missions, onLoad, onSave, isSaving, colors }: VHSTapeProps) {
  const missionName = missions[slot.missionIndex]?.title ?? "Unknown";
  const isEmpty = slot.timestamp === null;

  return (
    <Pressable
      style={[
        styles.tape,
        {
          backgroundColor: isEmpty ? colors.secondary : colors.card,
          borderColor: isEmpty ? colors.border : colors.primary,
        },
      ]}
      onPress={() => onLoad(slot.id)}
    >
      <View style={[styles.tapeLabel, { backgroundColor: isEmpty ? colors.muted : colors.blood }]}>
        <Text style={[styles.tapeSlot, { color: colors.foreground }]}>{slot.label}</Text>
      </View>
      <View style={styles.tapeBody}>
        {isEmpty ? (
          <Text style={[styles.tapeEmpty, { color: colors.mutedForeground }]}>
            — EMPTY —
          </Text>
        ) : (
          <>
            <Text style={[styles.tapeMission, { color: colors.foreground }]} numberOfLines={1}>
              {missionName}
            </Text>
            <Text style={[styles.tapeScore, { color: colors.clue }]}>
              {slot.score.toLocaleString()} pts
            </Text>
            <Text style={[styles.tapeDate, { color: colors.mutedForeground }]}>
              {formatDate(slot.timestamp)}
            </Text>
          </>
        )}
      </View>
      <Pressable
        style={[styles.tapeSaveBtn, { borderTopColor: colors.border }]}
        onPress={() => onSave(slot.id)}
      >
        <Feather name="save" size={12} color={colors.mutedForeground} />
        <Text style={[styles.tapeSaveTxt, { color: colors.mutedForeground }]}>SAVE</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  storeHeader: { alignItems: "center", gap: 4, paddingVertical: 8 },
  storeName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 3,
  },
  storeTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  shelfRow: {
    flexDirection: "row",
    gap: 10,
  },
  tape: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 140,
  },
  tapeLabel: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tapeSlot: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
  },
  tapeBody: {
    flex: 1,
    padding: 8,
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tapeEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 1,
  },
  tapeMission: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  tapeScore: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  tapeDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    textAlign: "center",
  },
  tapeSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  tapeSaveTxt: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  missionPreview: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  missionPreviewContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  missionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  missionLocation: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  threatText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  missionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  missionActionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 2,
  },
});
