"use client";

import { ExternalLink } from "lucide-react";
import type { SyntheticEvent } from "react";
import type { Player, PlayerTier } from "@/lib/api";
import { tierScores } from "@/lib/modes";
import styles from "./site-shell.module.css";

const tierPalette: Record<string, string> = {
  HT1: styles.tierHt1,
  LT1: styles.tierLt1,
  HT2: styles.tierHt2,
  LT2: styles.tierLt2,
  HT3: styles.tierHt3,
  LT3: styles.tierLt3,
  HT4: styles.tierHt4,
  LT4: styles.tierLt4,
  HT5: styles.tierHt5,
  LT5: styles.tierLt5,
  Unknown: styles.tierUnknown,
};

function getTierClass(tier: string) {
  return tierPalette[tier] ?? tierPalette.Unknown;
}

function getModeIconPath(mode: string) {
  const aliases: Record<string, string> = {
    "Diamond SMP": "Diamond%20SMP",
    "Diamond Survival": "Diamond%20Survival",
    "OG Vanilla": "OG%20Vanilla",
    "Spear Mace": "Spear%20Mace",
    "Spear Elytra": "Spear%20Elytra",
  };

  const filename = aliases[mode] ?? encodeURIComponent(mode);
  return `/gamemodes/${filename}.png`;
}

function getAvatarUrl(player: Pick<Player, "name" | "uuid">, size: number) {
  return `https://minotar.net/avatar/${encodeURIComponent(player.name)}/${size}`;
}

function getFallbackAvatarUrl(player: Pick<Player, "name" | "uuid">, size: number) {
  const uuid = player.uuid?.replace(/-/g, "");

  if (/^[a-fA-F0-9]{32}$/.test(uuid)) {
    return `https://crafatar.com/avatars/${uuid}?size=${size}&overlay`;
  }

  return `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/${size}`;
}

function handleAvatarError(player: Pick<Player, "name" | "uuid">, size: number) {
  return (event: SyntheticEvent<HTMLImageElement>) => {
    const fallbackUrl = getFallbackAvatarUrl(player, size);

    if (event.currentTarget.src !== fallbackUrl) {
      event.currentTarget.src = fallbackUrl;
    }
  };
}

function sortTiers(entries: PlayerTier[]) {
  return [...entries].sort((left, right) => {
    const tierDiff = (tierScores[right.tier] ?? 0) - (tierScores[left.tier] ?? 0);
    if (tierDiff !== 0) {
      return tierDiff;
    }

    return left.gamemode.localeCompare(right.gamemode);
  });
}

function getRegionClass(region: string) {
  const normalizedRegion = region.toUpperCase();

  if (normalizedRegion === "EU") {
    return styles.regionEu;
  }

  if (normalizedRegion === "NA") {
    return styles.regionNa;
  }

  if (normalizedRegion === "SA") {
    return styles.regionSa;
  }

  if (normalizedRegion === "AS") {
    return styles.regionAs;
  }

  if (normalizedRegion === "AU") {
    return styles.regionAu;
  }

  if (normalizedRegion === "AF") {
    return styles.regionAf;
  }

  if (normalizedRegion === "ME") {
    return styles.regionMe;
  }

  return styles.regionOther;
}

function TierBadge({ entry, retired = false }: { entry: PlayerTier; retired?: boolean }) {
  const tierLabel = retired && entry.tier !== "Unknown" ? `R${entry.tier}` : entry.tier;
  const peakTier = entry.peak && entry.peak !== "Unknown" ? entry.peak : entry.tier;

  return (
    <div
      className={`${styles.tierBadge} ${getTierClass(entry.tier)}`}
      data-tooltip={`${tierLabel}${peakTier && peakTier !== entry.tier ? ` (Highest ${peakTier})` : ""}`}
    >
      <span className={`${styles.tierIcon} ${styles[`tierIcon${entry.tier}`] ?? ""}`}>
        <img src={getModeIconPath(entry.gamemode)} alt="" className={styles.tierIconImage} />
      </span>
      <span className={styles.tierText}>{tierLabel}</span>
    </div>
  );
}

export default function PlayerModal({
  player,
  rank,
  onClose,
}: {
  player: Player;
  rank: number;
  onClose: () => void;
}) {
  const rankedModes = sortTiers(player.tiers.filter((entry) => entry.tier !== "Unknown"));
  const topPlacement = player.points;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <section className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose}>
          x
        </button>

        <div className={styles.modalHeader}>
          <img
            src={getAvatarUrl(player, 128)}
            onError={handleAvatarError(player, 128)}
            alt={player.name}
            className={styles.modalAvatar}
          />
          <h3 className={`display-font ${styles.modalName}`}>{player.name}</h3>
          <div className={styles.modalMetaRow}>
            <div className={styles.modalTag}>Combat {player.points >= 300 ? "Grandmaster" : player.points >= 200 ? "Master" : "Ace"}</div>
            <p className={`${styles.modalRegion} ${getRegionClass(player.region)}`}>{player.region}</p>
            <a
              href={`https://namemc.com/profile/${player.name}`}
              target="_blank"
              rel="noreferrer"
              className={styles.modalLink}
            >
              NameMC
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className={styles.modalSection}>
          <p className={styles.modalLabel}>Position</p>
          <div className={styles.modalPosition}>
            <div className={`${styles.rankBadge} ${styles.rankGold}`}>{rank > 0 ? rank : "#"}</div>
            <div className={styles.modalPositionText}>
              <img src="/Trophy_Icon.png" alt="" className={styles.modalPositionIcon} />
              <span>Overall</span>
              <small>({topPlacement} points)</small>
            </div>
          </div>
        </div>

        <div className={styles.modalSection}>
          <p className={styles.modalLabel}>Tiers</p>
          <div className={styles.modalTiers}>
            {rankedModes.length > 0 ? (
              rankedModes.map((entry) => (
                <TierBadge
                  key={`${player.uuid}-${entry.gamemode}`}
                  entry={entry}
                  retired={player.retired_modes?.includes(entry.gamemode)}
                />
              ))
            ) : (
              <span className={styles.emptyPill}>Unranked</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
