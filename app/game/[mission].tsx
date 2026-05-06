import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { StatBar } from "@/components/StatBar";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const TILE_SIZE = 40;
const COLS = 15;
const ROWS = 12;
const MAP_W = COLS * TILE_SIZE;
const MAP_H = ROWS * TILE_SIZE;

type TileType = "floor" | "wall" | "clue" | "enemy" | "boss" | "exit";

interface Tile {
  type: TileType;
  x: number;
  y: number;
  revealed: boolean;
  collected?: boolean;
  clueText?: string;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: "grunt" | "patrol" | "elite";
  alive: boolean;
  moveTimer: number;
}

const CLUE_TEXTS = [
  "Victims found with ritual symbols carved backward",
  "Smell of sulfur reported for three blocks",
  "Security footage corrupted — not erased, corrupted",
  "Local dogs vanished two weeks before first kill",
  "Survivor reports hearing breathing in walls",
  "Pattern of killings matches lunar cycle",
  "Underground tunnels discovered beneath building",
  "Anonymous tip: 'It has been here before'",
];

function generateMap(missionId: string): { tiles: Tile[][], enemies: Enemy[] } {
  const seed = missionId.charCodeAt(1) || 1;
  const tiles: Tile[][] = [];
  const enemies: Enemy[] = [];

  for (let r = 0; r < ROWS; r++) {
    tiles[r] = [];
    for (let c = 0; c < COLS; c++) {
      const isEdge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
      const isWall =
        isEdge ||
        (r % 3 === 0 && c % 4 === (seed % 3) && r > 1 && r < ROWS - 1) ||
        (c % 5 === 2 && r % 2 === 0 && c > 1 && c < COLS - 1 && r > 1);
      tiles[r][c] = {
        type: isWall ? "wall" : "floor",
        x: c,
        y: r,
        revealed: false,
      };
    }
  }

  const cluePositions = [
    [2, 2], [4, 6], [7, 2], [9, 8], [12, 4], [3, 10], [10, 10], [6, 5],
  ];
  cluePositions.forEach(([c, r], i) => {
    if (tiles[r] && tiles[r][c] && tiles[r][c].type === "floor") {
      tiles[r][c].type = "clue";
      tiles[r][c].clueText = CLUE_TEXTS[i] ?? CLUE_TEXTS[0];
    }
  });

  const enemyPos = [
    [5, 4, "grunt"], [8, 6, "patrol"], [11, 3, "grunt"], [3, 8, "patrol"], [10, 7, "elite"],
  ] as const;
  enemyPos.forEach(([c, r, type], i) => {
    if (tiles[r] && tiles[r][c] && tiles[r][c].type === "floor") {
      tiles[r][c].type = "enemy";
      enemies.push({
        id: `e${i}`,
        x: c,
        y: r,
        hp: type === "elite" ? 40 : type === "patrol" ? 20 : 15,
        maxHp: type === "elite" ? 40 : type === "patrol" ? 20 : 15,
        type,
        alive: true,
        moveTimer: 0,
      });
    }
  });

  if (tiles[2] && tiles[2][13]) tiles[2][13].type = "boss";
  if (tiles[ROWS - 2] && tiles[COLS - 2]) {
    tiles[ROWS - 2][COLS - 2].type = "exit";
  }

  return { tiles, enemies };
}

function revealAround(tiles: Tile[][], px: number, py: number, radius = 3) {
  const updated = tiles.map((row) => row.map((t) => ({ ...t })));
  for (let r = Math.max(0, py - radius); r <= Math.min(ROWS - 1, py + radius); r++) {
    for (let c = Math.max(0, px - radius); c <= Math.min(COLS - 1, px + radius); c++) {
      const dist = Math.sqrt((c - px) ** 2 + (r - py) ** 2);
      if (dist <= radius) {
        updated[r][c].revealed = true;
      }
    }
  }
  return updated;
}

export default function GameScreen() {
  const { mission: missionId } = useLocalSearchParams<{ mission: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, collectClue, completeMission, unlockMonster, takeDamage, healPlayer, resetMission } = useGame();

  const mission = state.missions.find((m) => m.id === missionId);
  const [mapData] = useState(() => generateMap(missionId ?? "m1"));
  const [tiles, setTiles] = useState<Tile[][]>(() => revealAround(mapData.tiles, 1, 1));
  const [enemies, setEnemies] = useState<Enemy[]>(mapData.enemies);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [score, setScore] = useState(0);
  const [cluesFound, setCluesFound] = useState<string[]>([]);
  const [combatMsg, setCombatMsg] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [bossDefeated, setBossDefeated] = useState(false);
  const msgAnim = useRef(new Animated.Value(0)).current;
  const playerHp = state.playerHp;
  const playerMaxHp = state.playerMaxHp;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const showMsg = useCallback(
    (msg: string) => {
      setCombatMsg(msg);
      msgAnim.setValue(1);
      Animated.timing(msgAnim, {
        toValue: 0,
        duration: 1800,
        useNativeDriver: true,
      }).start();
    },
    [msgAnim]
  );

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameOver || victory) return;
      setPlayerPos((prev) => {
        const nx = prev.x + dx;
        const ny = prev.y + dy;

        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return prev;

        const tile = tiles[ny]?.[nx];
        if (!tile || tile.type === "wall") return prev;

        if (tile.type === "enemy") {
          const enemy = enemies.find((e) => e.x === nx && e.y === ny && e.alive);
          if (enemy) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const dmgToEnemy = 20 + Math.floor(Math.random() * 15);
            const dmgToPlayer = enemy.type === "elite" ? 25 : enemy.type === "patrol" ? 15 : 8;

            setEnemies((prev) =>
              prev.map((e) =>
                e.id === enemy.id
                  ? { ...e, hp: Math.max(0, e.hp - dmgToEnemy), alive: e.hp - dmgToEnemy > 0 }
                  : e
              )
            );

            if (enemy.hp - dmgToEnemy <= 0) {
              setScore((s) => s + (enemy.type === "elite" ? 300 : enemy.type === "patrol" ? 150 : 80));
              setTiles((t) => {
                const updated = t.map((row) => row.map((cell) => ({ ...cell })));
                updated[ny][nx].type = "floor";
                return updated;
              });
              showMsg(`ELIMINATED — +${enemy.type === "elite" ? 300 : 150} pts`);
            } else {
              takeDamage(dmgToPlayer);
              showMsg(`HIT FOR ${dmgToPlayer} — ${enemy.type.toUpperCase()} FIGHTS BACK`);
              if (playerHp - dmgToPlayer <= 0) {
                setGameOver(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
            return prev;
          }
        }

        if (tile.type === "boss" && !bossDefeated) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            "⚠ BOSS ENCOUNTER",
            `${mission?.bossName ?? "The Boss"}\n\nThis is a brutal fight. Engage?`,
            [
              { text: "Retreat", style: "cancel" },
              {
                text: "FIGHT",
                style: "destructive",
                onPress: () => {
                  const win = Math.random() > 0.4;
                  if (win) {
                    setBossDefeated(true);
                    setScore((s) => s + 2000);
                    setTiles((t) => {
                      const updated = t.map((row) => row.map((cell) => ({ ...cell })));
                      updated[ny][nx].type = "exit";
                      return updated;
                    });
                    showMsg("BOSS DEFEATED — +2000 pts");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (cluesFound.length >= (mission?.cluesRequired ?? 8)) {
                      unlockMonster(missionId ?? "m1", {
                        id: `hidden_${missionId}`,
                        name: "The Cipher",
                        type: "Conceptual Entity",
                        description: "It doesn't exist until you observe it. Then it always has.",
                        weaknesses: ["Light", "Documentation"],
                        hp: 999,
                        damage: 99,
                        speed: 0,
                      });
                    }
                  } else {
                    takeDamage(50);
                    showMsg("DEFEATED BY BOSS — MASSIVE DAMAGE");
                    if (playerHp - 50 <= 0) setGameOver(true);
                  }
                },
              },
            ]
          );
          return prev;
        }

        if (tile.type === "exit" && bossDefeated) {
          setVictory(true);
          completeMission(missionId ?? "m1", score + 500);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return prev;
        }

        const newTiles = revealAround(tiles, nx, ny);

        if (tile.type === "clue" && tile.clueText && !tile.collected) {
          newTiles[ny][nx].collected = true;
          newTiles[ny][nx].type = "floor";
          const newClue = tile.clueText;
          setCluesFound((c) => {
            const updated = [...c, newClue];
            collectClue(missionId ?? "m1", newClue);
            return updated;
          });
          setScore((s) => s + 200);
          showMsg(`CLUE FOUND — +200 pts`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setTiles(newTiles);
        return { x: nx, y: ny };
      });
    },
    [tiles, enemies, gameOver, victory, bossDefeated, cluesFound, playerHp, mission, missionId, collectClue, completeMission, takeDamage, unlockMonster, showMsg, score]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx < 8 && absDy < 8) return;
        if (absDx > absDy) {
          movePlayer(dx > 0 ? 1 : -1, 0);
        } else {
          movePlayer(0, dy > 0 ? 1 : -1);
        }
      },
    })
  ).current;

  const viewOffsetX = Math.max(0, Math.min(playerPos.x * TILE_SIZE - SCREEN_W / 2, MAP_W - SCREEN_W));
  const viewOffsetY = Math.max(0, Math.min(playerPos.y * TILE_SIZE - 200, MAP_H - 300));

  if (gameOver) {
    return (
      <GameOverlay
        title="YOU DIED"
        subtitle="The monster claims another."
        color={colors.blood}
        colors={colors}
        onAction={() => {
          resetMission(missionId ?? "m1");
          router.back();
        }}
        actionLabel="RETREAT TO DOSSIER"
      />
    );
  }

  if (victory) {
    return (
      <GameOverlay
        title="MISSION COMPLETE"
        subtitle={`Score: ${score.toLocaleString()}`}
        color={colors.neon}
        colors={colors}
        onAction={() => router.push("/")}
        actionLabel="RETURN TO BASE"
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <View
        style={styles.mapContainer}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.mapView,
            { transform: [{ translateX: -viewOffsetX }, { translateY: -viewOffsetY }] },
          ]}
        >
          {tiles.map((row, r) =>
            row.map((tile, c) => (
              <MapTile
                key={`${r}-${c}`}
                tile={tile}
                isPlayer={playerPos.x === c && playerPos.y === r}
                colors={colors}
              />
            ))
          )}
        </View>
      </View>

      <View
        style={[
          styles.hud,
          { paddingTop: topPad + 4, backgroundColor: "rgba(0,0,0,0.88)" },
        ]}
        pointerEvents="none"
      >
        <View style={styles.hudRow}>
          <View style={styles.hudLeft}>
            <StatBar label="HP" current={playerHp} max={playerMaxHp} color={colors.blood} />
            <Text style={[styles.hudScore, { color: colors.clue }]}>
              {score.toLocaleString()} PTS
            </Text>
          </View>
          <View style={styles.hudRight}>
            <Text style={[styles.hudClues, { color: cluesFound.length >= (mission?.cluesRequired ?? 8) ? colors.neon : colors.foreground }]}>
              CLUES {cluesFound.length}/{mission?.cluesRequired ?? 8}
            </Text>
            <Text style={[styles.hudMission, { color: colors.mutedForeground }]}>
              {mission?.title}
            </Text>
          </View>
        </View>
      </View>

      <Animated.View
        style={[styles.combatMsg, { opacity: msgAnim }]}
        pointerEvents="none"
      >
        <Text style={[styles.combatMsgText, { color: colors.neon }]}>{combatMsg}</Text>
      </Animated.View>

      <View style={styles.dpadContainer} pointerEvents="box-none">
        <Pressable
          style={[styles.dpadBtn, { backgroundColor: "rgba(139,0,0,0.7)" }]}
          onPress={() => movePlayer(0, -1)}
        >
          <Feather name="arrow-up" size={20} color="#fff" />
        </Pressable>
        <View style={styles.dpadMiddle}>
          <Pressable
            style={[styles.dpadBtn, { backgroundColor: "rgba(139,0,0,0.7)" }]}
            onPress={() => movePlayer(-1, 0)}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.dpadCenter, { backgroundColor: "rgba(40,20,15,0.7)", borderColor: "#8b0000" }]}
            onPress={() => router.back()}
          >
            <Feather name="minimize" size={14} color="#666" />
          </Pressable>
          <Pressable
            style={[styles.dpadBtn, { backgroundColor: "rgba(139,0,0,0.7)" }]}
            onPress={() => movePlayer(1, 0)}
          >
            <Feather name="arrow-right" size={20} color="#fff" />
          </Pressable>
        </View>
        <Pressable
          style={[styles.dpadBtn, { backgroundColor: "rgba(139,0,0,0.7)" }]}
          onPress={() => movePlayer(0, 1)}
        >
          <Feather name="arrow-down" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

interface MapTileProps {
  tile: Tile;
  isPlayer: boolean;
  colors: ReturnType<typeof useColors>;
}

function MapTile({ tile, isPlayer, colors }: MapTileProps) {
  if (!tile.revealed && !isPlayer) {
    return (
      <View
        style={[
          styles.tile,
          { left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE, backgroundColor: "#000" },
        ]}
      />
    );
  }

  const getBg = () => {
    if (isPlayer) return colors.primary;
    switch (tile.type) {
      case "wall": return "#0d0d0d";
      case "clue": return colors.clue + "44";
      case "enemy": return "#1a0000";
      case "boss": return "#2a0000";
      case "exit": return colors.neon + "22";
      default: return "#0a0806";
    }
  };

  const getIcon = () => {
    if (isPlayer) return "•";
    switch (tile.type) {
      case "wall": return "█";
      case "clue": return "?";
      case "enemy": return "☠";
      case "boss": return "☾";
      case "exit": return "▶";
      default: return "";
    }
  };

  const getIconColor = () => {
    switch (tile.type) {
      case "clue": return colors.clue;
      case "enemy": return colors.blood;
      case "boss": return "#ff0000";
      case "exit": return colors.neon;
      case "wall": return "#1a1410";
      default: return colors.mutedForeground;
    }
  };

  return (
    <View
      style={[
        styles.tile,
        {
          left: tile.x * TILE_SIZE,
          top: tile.y * TILE_SIZE,
          backgroundColor: getBg(),
          borderWidth: tile.type === "wall" ? 0 : 0.5,
          borderColor: "rgba(255,255,255,0.04)",
        },
      ]}
    >
      {isPlayer ? (
        <View style={[styles.playerDot, { backgroundColor: colors.primary }]} />
      ) : (
        <Text style={[styles.tileIcon, { color: getIconColor() }]}>{getIcon()}</Text>
      )}
    </View>
  );
}

interface GameOverlayProps {
  title: string;
  subtitle: string;
  color: string;
  colors: ReturnType<typeof useColors>;
  onAction: () => void;
  actionLabel: string;
}

function GameOverlay({ title, subtitle, color, colors, onAction, actionLabel }: GameOverlayProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.root,
        styles.overlay,
        { backgroundColor: "rgba(0,0,0,0.95)", paddingTop: topPad, paddingBottom: botPad },
      ]}
    >
      <Text style={[styles.overlayTitle, { color }]}>{title}</Text>
      <Text style={[styles.overlaySubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      <Pressable
        style={[styles.overlayBtn, { backgroundColor: color + "33", borderColor: color }]}
        onPress={onAction}
      >
        <Text style={[styles.overlayBtnText, { color }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  mapView: {
    width: MAP_W,
    height: MAP_H,
    position: "relative",
  },
  tile: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIcon: {
    fontSize: 16,
  },
  playerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  hudLeft: { flex: 1, gap: 2 },
  hudRight: { alignItems: "flex-end", gap: 2 },
  hudScore: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  hudClues: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
  },
  hudMission: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 1,
  },
  combatMsg: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  combatMsgText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 2,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  dpadContainer: {
    position: "absolute",
    bottom: 40,
    right: 24,
    alignItems: "center",
    gap: 4,
  },
  dpadMiddle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dpadBtn: {
    width: 52,
    height: 52,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dpadCenter: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  overlayTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    letterSpacing: 3,
  },
  overlaySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  overlayBtn: {
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 4,
    marginTop: 20,
  },
  overlayBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 2,
  },
});
