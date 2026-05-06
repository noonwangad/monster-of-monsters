import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Companion {
  id: string;
  name: string;
  archetype: string;
  description: string;
  ability: string;
  abilityDesc: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  unlocked: boolean;
}

export interface Monster {
  id: string;
  name: string;
  type: string;
  description: string;
  weaknesses: string[];
  hp: number;
  damage: number;
  speed: number;
}

export interface Mission {
  id: string;
  title: string;
  location: string;
  threat: string;
  bossName: string;
  bossDescription: string;
  cluesRequired: number;
  completed: boolean;
  unlocked: boolean;
}

export interface SaveSlot {
  id: number;
  label: string;
  missionIndex: number;
  score: number;
  companions: string[];
  timestamp: number | null;
}

export interface GameState {
  currentMission: number;
  totalScore: number;
  companions: Companion[];
  activeParty: string[];
  missions: Mission[];
  cluesCollected: Record<string, string[]>;
  hiddenMonsters: Record<string, Monster>;
  saveSlots: SaveSlot[];
  playerHp: number;
  playerMaxHp: number;
}

interface GameContextValue {
  state: GameState;
  addCompanionToParty: (id: string) => void;
  removeCompanionFromParty: (id: string) => void;
  collectClue: (missionId: string, clue: string) => void;
  completeMission: (missionId: string, score: number) => void;
  unlockMonster: (missionId: string, monster: Monster) => void;
  saveGame: (slotId: number) => Promise<void>;
  loadGame: (slotId: number) => Promise<void>;
  takeDamage: (amount: number) => void;
  healPlayer: (amount: number) => void;
  resetMission: (missionId: string) => void;
}

const COMPANIONS_DATA: Companion[] = [
  {
    id: "c1",
    name: "Vasquez",
    archetype: "Street Mystic",
    description: "Streetwalker marked head to toe with mythos tattoos. She sees things others cannot.",
    ability: "Second Sight",
    abilityDesc: "Reveals hidden clues on the map",
    hp: 80,
    maxHp: 80,
    stamina: 60,
    maxStamina: 60,
    unlocked: true,
  },
  {
    id: "c2",
    name: "Officer Chen",
    archetype: "Rogue Cop",
    description: "Former detective who went rogue after her precinct was slaughtered. Ice cold, trigger happy.",
    ability: "Breach & Clear",
    abilityDesc: "Stuns all enemies in a room for 3 seconds",
    hp: 120,
    maxHp: 120,
    stamina: 40,
    maxStamina: 40,
    unlocked: true,
  },
  {
    id: "c3",
    name: "Mireille",
    archetype: "Occultist",
    description: "Scholar of forbidden texts. Her mind is half gone but her rituals work.",
    ability: "Ward",
    abilityDesc: "Creates a barrier that absorbs one hit",
    hp: 60,
    maxHp: 60,
    stamina: 100,
    maxStamina: 100,
    unlocked: true,
  },
  {
    id: "c4",
    name: "Tanya",
    archetype: "Knife Dancer",
    description: "Circus runaway with blades hidden everywhere on her body. Never misses.",
    ability: "Flurry",
    abilityDesc: "Triple strike dealing burst damage",
    hp: 70,
    maxHp: 70,
    stamina: 80,
    maxStamina: 80,
    unlocked: false,
  },
  {
    id: "c5",
    name: "Dr. Horne",
    archetype: "Field Medic",
    description: "Trauma surgeon who knows exactly where it hurts. On both sides of the blade.",
    ability: "Triage",
    abilityDesc: "Restores 40 HP to the whole party",
    hp: 90,
    maxHp: 90,
    stamina: 50,
    maxStamina: 50,
    unlocked: false,
  },
  {
    id: "c6",
    name: "Lara Vex",
    archetype: "Arms Runner",
    description: "Black market weapons dealer. Has access to ordnance nobody else can get.",
    ability: "Molotov",
    abilityDesc: "Area denial fire damage for 5 seconds",
    hp: 100,
    maxHp: 100,
    stamina: 55,
    maxStamina: 55,
    unlocked: false,
  },
  {
    id: "c7",
    name: "Nadia Sable",
    archetype: "Assassin",
    description: "Contract killer gone freelance. Silent, fast, devastating.",
    ability: "Shadow Step",
    abilityDesc: "Teleports behind target for instant kill",
    hp: 65,
    maxHp: 65,
    stamina: 90,
    maxStamina: 90,
    unlocked: false,
  },
  {
    id: "c8",
    name: "Mama Rue",
    archetype: "Houngan",
    description: "Voodoo practitioner from New Orleans. She can raise the fallen... temporarily.",
    ability: "Reanimate",
    abilityDesc: "Revives a fallen party member with 30 HP",
    hp: 75,
    maxHp: 75,
    stamina: 70,
    maxStamina: 70,
    unlocked: false,
  },
  {
    id: "c9",
    name: "Sergeant Holloway",
    archetype: "Military Veteran",
    description: "Three tours of a war that doesn't exist on any record. She knows horrors.",
    ability: "Fortify",
    abilityDesc: "Doubles party defense for 4 seconds",
    hp: 150,
    maxHp: 150,
    stamina: 30,
    maxStamina: 30,
    unlocked: false,
  },
  {
    id: "c10",
    name: "Aya",
    archetype: "Oracle",
    description: "A child who hasn't aged in thirty years. She knows how the mission ends.",
    ability: "Foresight",
    abilityDesc: "Predicts and cancels the next enemy attack",
    hp: 50,
    maxHp: 50,
    stamina: 120,
    maxStamina: 120,
    unlocked: false,
  },
];

const MISSIONS_DATA: Mission[] = [
  {
    id: "m1",
    title: "The Abattoir",
    location: "Condemned Meatpacking District",
    threat: "EXTREME",
    bossName: "The Butcher",
    bossDescription: "A towering creature that wears the skins of its victims like trophies. It has been operating in the meatpacking district for three months. Workers report hearing prayers spoken backwards through the vents.",
    cluesRequired: 8,
    completed: false,
    unlocked: true,
  },
  {
    id: "m2",
    title: "The Choir",
    location: "Abandoned Cathedral, Eastside",
    threat: "SEVERE",
    bossName: "The Cantor",
    bossDescription: "A being that communicates through sound frequencies beyond human hearing. Those who've heard its voice are found weeks later with their eardrums dissolved. The cathedral has been sealed since 1987.",
    cluesRequired: 8,
    completed: false,
    unlocked: false,
  },
  {
    id: "m3",
    title: "Bloodlines",
    location: "Underground Tunnels, Old City",
    threat: "CRITICAL",
    bossName: "The Matriarch",
    bossDescription: "Ancient. Primordial. It has been beneath this city longer than the city itself. Whatever it is, it is no longer alone. Thermal imaging suggests at least a dozen offspring.",
    cluesRequired: 8,
    completed: false,
    unlocked: false,
  },
  {
    id: "m4",
    title: "The Gallery",
    location: "Contemporary Art Museum",
    threat: "EXTREME",
    bossName: "The Curator",
    bossDescription: "It curates human experiences like fine art. Victims are found in poses of perfect agony, perfectly preserved, perfectly displayed. The museum's security footage shows nothing unusual.",
    cluesRequired: 8,
    completed: false,
    unlocked: false,
  },
  {
    id: "m5",
    title: "Last Call",
    location: "The Red Door Tavern",
    threat: "SEVERE",
    bossName: "The Landlord",
    bossDescription: "It has been running this establishment for sixty years. The drinks are good. The patrons never leave. Satellites show a heat signature the size of a building growing beneath the foundation.",
    cluesRequired: 8,
    completed: false,
    unlocked: false,
  },
];

const SAVE_SLOTS_DEFAULT: SaveSlot[] = [
  { id: 1, label: "SLOT 1", missionIndex: 0, score: 0, companions: [], timestamp: null },
  { id: 2, label: "SLOT 2", missionIndex: 0, score: 0, companions: [], timestamp: null },
  { id: 3, label: "SLOT 3", missionIndex: 0, score: 0, companions: [], timestamp: null },
];

const INITIAL_STATE: GameState = {
  currentMission: 0,
  totalScore: 0,
  companions: COMPANIONS_DATA,
  activeParty: ["c1", "c2"],
  missions: MISSIONS_DATA,
  cluesCollected: {},
  hiddenMonsters: {},
  saveSlots: SAVE_SLOTS_DEFAULT,
  playerHp: 150,
  playerMaxHp: 150,
};

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "@monster_of_monsters_state";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data) as GameState;
          setState(parsed);
        } catch (_) {}
      }
    });
  }, []);

  const persist = useCallback((s: GameState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
  }, []);

  const addCompanionToParty = useCallback((id: string) => {
    setState((prev) => {
      if (prev.activeParty.includes(id) || prev.activeParty.length >= 3) return prev;
      const next = { ...prev, activeParty: [...prev.activeParty, id] };
      persist(next);
      return next;
    });
  }, [persist]);

  const removeCompanionFromParty = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, activeParty: prev.activeParty.filter((x) => x !== id) };
      persist(next);
      return next;
    });
  }, [persist]);

  const collectClue = useCallback((missionId: string, clue: string) => {
    setState((prev) => {
      const existing = prev.cluesCollected[missionId] ?? [];
      if (existing.includes(clue)) return prev;
      const next = {
        ...prev,
        cluesCollected: {
          ...prev.cluesCollected,
          [missionId]: [...existing, clue],
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const completeMission = useCallback((missionId: string, score: number) => {
    setState((prev) => {
      const missions = prev.missions.map((m, i) => {
        if (m.id === missionId) return { ...m, completed: true };
        if (prev.missions[i - 1]?.id === missionId) return { ...m, unlocked: true };
        return m;
      });
      const next = {
        ...prev,
        missions,
        totalScore: prev.totalScore + score,
        currentMission: Math.min(prev.currentMission + 1, missions.length - 1),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const unlockMonster = useCallback((missionId: string, monster: Monster) => {
    setState((prev) => {
      const next = {
        ...prev,
        hiddenMonsters: { ...prev.hiddenMonsters, [missionId]: monster },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const saveGame = useCallback(async (slotId: number) => {
    setState((prev) => {
      const saveSlots = prev.saveSlots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              missionIndex: prev.currentMission,
              score: prev.totalScore,
              companions: prev.activeParty,
              timestamp: Date.now(),
            }
          : s
      );
      const next = { ...prev, saveSlots };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const loadGame = useCallback(async (slotId: number) => {
    setState((prev) => {
      const slot = prev.saveSlots.find((s) => s.id === slotId);
      if (!slot || slot.timestamp === null) return prev;
      return {
        ...prev,
        currentMission: slot.missionIndex,
        totalScore: slot.score,
        activeParty: slot.companions,
      };
    });
  }, []);

  const takeDamage = useCallback((amount: number) => {
    setState((prev) => {
      const next = { ...prev, playerHp: Math.max(0, prev.playerHp - amount) };
      persist(next);
      return next;
    });
  }, [persist]);

  const healPlayer = useCallback((amount: number) => {
    setState((prev) => {
      const next = { ...prev, playerHp: Math.min(prev.playerMaxHp, prev.playerHp + amount) };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetMission = useCallback((missionId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        playerHp: prev.playerMaxHp,
        cluesCollected: { ...prev.cluesCollected, [missionId]: [] },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  return (
    <GameContext.Provider
      value={{
        state,
        addCompanionToParty,
        removeCompanionFromParty,
        collectClue,
        completeMission,
        unlockMonster,
        saveGame,
        loadGame,
        takeDamage,
        healPlayer,
        resetMission,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
