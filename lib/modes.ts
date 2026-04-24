export const tierScores: Record<string, number> = {
  HT1: 30,
  LT1: 25,
  HT2: 20,
  LT2: 16,
  HT3: 12,
  LT3: 9,
  HT4: 6,
  LT4: 4,
  HT5: 2,
  LT5: 1,
  Unknown: 0,
};

export const tierOrder = Object.keys(tierScores);

export const modeGroups = {
  global: [
    "Sword",
    "Axe",
    "Vanilla",
    "Pot",
    "NethOP",
    "UHC",
    "SMP",
    "Mace",
    "Speed",
    "Creeper",
    "Elytra",
    "Minecart",
    "Trident",
    "Diamond Survival",
    "Diamond SMP",
    "OG Vanilla",
    "DeBuff",
    "Bed",
    "Bow",
    "Manhunt",
    "AxePot",
    "Pufferfish",
    "OP",
    "Spear Mace",
    "Spear Elytra",
    "Bridge",
    "Pearl",
    "Sumo",
  ],
  main: ["Sword", "Axe", "Vanilla", "Pot", "NethOP", "UHC", "SMP", "Mace"],
  sub: [
    "Speed",
    "Creeper",
    "Elytra",
    "Minecart",
    "Trident",
    "Diamond Survival",
    "Diamond SMP",
    "OG Vanilla",
    "DeBuff",
    "Bed",
    "Bow",
    "Manhunt",
  ],
  extra: ["AxePot", "Pufferfish", "OP", "Spear Mace", "Spear Elytra"],
  bonus: ["Bridge", "Pearl", "Sumo"],
} as const;

export type ModeGroupKey = keyof typeof modeGroups;

export const groupLabels: Record<ModeGroupKey, string> = {
  global: "Global",
  main: "Main Modes",
  sub: "Sub Modes",
  extra: "Extra Modes",
  bonus: "Bonus Modes",
};

export const allModes = Array.from(new Set(Object.values(modeGroups).flat()));
