import { allModes, tierScores } from "@/lib/modes";

export type PlayerTier = {
  gamemode: string;
  tier: string;
  peak?: string;
};

export type Player = {
  id?: number;
  uuid: string;
  name: string;
  region: string;
  points: number;
  nitro?: boolean;
  banner?: string;
  retired_modes?: string[];
  tiers: PlayerTier[];
};

const API_URL = "https://ultratiers.onrender.com/players";

const fallbackPlayers: Player[] = [];

function normalizePlayer(player: Player): Player {
  const tierMap = new Map(player.tiers.map((entry) => [entry.gamemode, entry]));
  const tiers = allModes.map((mode) => {
    const entry = tierMap.get(mode);

    return {
      gamemode: mode,
      tier: entry?.tier ?? "Unknown",
      peak: entry?.peak ?? entry?.tier ?? "Unknown",
    };
  });

  const points = tiers.reduce((sum, entry) => sum + (tierScores[entry.tier] ?? 0), 0);

  return {
    ...player,
    region: player.region || "Unknown",
    points,
    tiers,
    retired_modes: Array.isArray(player.retired_modes) ? player.retired_modes : [],
    banner: player.banner || "anime-style-stone.jpg",
  };
}

export async function fetchPlayers(): Promise<Player[]> {
  try {
    const response = await fetch(API_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Player request failed with ${response.status}`);
    }

    const data = (await response.json()) as Player[];
    return data.map(normalizePlayer);
  } catch {
    return fallbackPlayers;
  }
}
