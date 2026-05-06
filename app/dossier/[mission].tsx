import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
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

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: "#ff0000",
  EXTREME: "#ff4500",
  SEVERE: "#d4af37",
  HIGH: "#ffa500",
  MODERATE: "#39ff14",
};

export default function DossierScreen() {
  const { mission: missionId } = useLocalSearchParams<{ mission: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  const mission = state.missions.find((m) => m.id === missionId);
  const cluesForMission = state.cluesCollected[missionId ?? ""] ?? [];

  const topAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(topAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(bodyAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [topAnim, bodyAnim]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!mission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Mission not found.</Text>
      </View>
    );
  }

  const threatColor = THREAT_COLORS[mission.threat] ?? colors.primary;
  const clueProgress = cluesForMission.length;
  const allCluesCollected = clueProgress >= mission.cluesRequired;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require("@/assets/images/dossier-bg.png")}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.18 }}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(5,3,0,0.82)" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: botPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: topAnim,
              transform: [{ translateY: topAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View
              style={[styles.classifiedStamp, { borderColor: threatColor }]}
            >
              <Text style={[styles.classifiedText, { color: threatColor }]}>
                {mission.threat}
              </Text>
            </View>
            <Text style={[styles.missionCode, { color: colors.mutedForeground }]}>
              MISSION FILE #{missionId?.toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.missionTitle, { color: colors.foreground }]}>
            {mission.title}
          </Text>
          <Text style={[styles.missionLocation, { color: colors.primary }]}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            {"  "}{mission.location}
          </Text>
        </Animated.View>

        <BloodDivider color={colors.blood} />

        <Animated.View
          style={[
            styles.bodySection,
            {
              opacity: bodyAnim,
              transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <DossierSection title="TARGET PROFILE" colors={colors}>
            <Text style={[styles.bossName, { color: threatColor }]}>
              {mission.bossName}
            </Text>
            <Text style={[styles.bossDesc, { color: colors.mutedForeground }]}>
              {mission.bossDescription}
            </Text>
          </DossierSection>

          <DossierSection title="INTELLIGENCE BRIEF" colors={colors}>
            <View style={styles.intelRow}>
              <IntelItem
                label="CLUES REQUIRED"
                value={`${mission.cluesRequired}`}
                colors={colors}
              />
              <IntelItem
                label="CLUES COLLECTED"
                value={`${clueProgress}/${mission.cluesRequired}`}
                colors={colors}
                highlight={allCluesCollected}
              />
            </View>
            {allCluesCollected && (
              <View style={[styles.unlockHint, { backgroundColor: colors.blood + "33", borderColor: colors.blood }]}>
                <Feather name="unlock" size={12} color={colors.primary} />
                <Text style={[styles.unlockText, { color: colors.primary }]}>
                  ALL CLUES COLLECTED — HIDDEN MONSTER UNLOCKED
                </Text>
              </View>
            )}
          </DossierSection>

          {clueProgress > 0 && (
            <DossierSection title="COLLECTED EVIDENCE" colors={colors}>
              {cluesForMission.map((clue, i) => (
                <View key={i} style={styles.clueItem}>
                  <Feather name="file-text" size={12} color={colors.clue} />
                  <Text style={[styles.clueText, { color: colors.foreground }]}>
                    {clue}
                  </Text>
                </View>
              ))}
            </DossierSection>
          )}

          <DossierSection title="ACTIVE PARTY" colors={colors}>
            {state.activeParty.length === 0 ? (
              <Text style={[styles.noParty, { color: colors.mutedForeground }]}>
                No companions assigned. Visit the Party screen.
              </Text>
            ) : (
              state.activeParty.map((cid) => {
                const comp = state.companions.find((c) => c.id === cid);
                if (!comp) return null;
                return (
                  <View key={cid} style={styles.partyMemberRow}>
                    <Feather name="user" size={12} color={colors.mutedForeground} />
                    <View style={styles.partyMemberInfo}>
                      <Text style={[styles.partyMemberName, { color: colors.foreground }]}>
                        {comp.name}
                      </Text>
                      <Text style={[styles.partyMemberRole, { color: colors.primary }]}>
                        {comp.archetype}
                      </Text>
                    </View>
                    <Text style={[styles.partyAbility, { color: colors.clue }]}>
                      {comp.ability}
                    </Text>
                  </View>
                );
              })
            )}
          </DossierSection>

          <View style={styles.actions}>
            <Pressable
              style={[styles.launchBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push(`/game/${missionId}` as any);
              }}
              testID="launch-mission"
            >
              <Feather name="crosshair" size={18} color="#fff" />
              <Text style={styles.launchText}>ENTER THE HUNT</Text>
            </Pressable>

            <Pressable
              style={[styles.partyBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/party")}
            >
              <Feather name="users" size={14} color={colors.mutedForeground} />
              <Text style={[styles.partyBtnText, { color: colors.mutedForeground }]}>
                MANAGE PARTY
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <Pressable
        style={[styles.backBtn, { top: topPad + 8 }]}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function DossierSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionBody, { borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function IntelItem({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  highlight?: boolean;
}) {
  return (
    <View style={styles.intelItem}>
      <Text style={[styles.intelLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.intelValue, { color: highlight ? colors.neon : colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  headerSection: { gap: 6, paddingTop: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  classifiedStamp: {
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    transform: [{ rotate: "-2deg" }],
  },
  classifiedText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 4,
  },
  missionCode: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 2,
  },
  missionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 36,
  },
  missionLocation: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bodySection: { gap: 14 },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  sectionBody: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  bossName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  bossDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  intelRow: {
    flexDirection: "row",
    gap: 20,
  },
  intelItem: { gap: 2 },
  intelLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  intelValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  unlockHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 3,
  },
  unlockText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
    flex: 1,
  },
  clueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  clueText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  noParty: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    fontStyle: "italic",
  },
  partyMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  partyMemberInfo: { flex: 1 },
  partyMemberName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  partyMemberRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  partyAbility: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
  },
  actions: { gap: 10, marginTop: 6 },
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 4,
  },
  launchText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 2,
  },
  partyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  partyBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 2,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    padding: 8,
  },
});
