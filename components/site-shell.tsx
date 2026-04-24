"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, ChevronsUp, ExternalLink, Loader2, Search, ShoppingBag, Trophy, X } from "lucide-react";
import { fetchPlayers, type Player, type PlayerTier } from "@/lib/api";
import { groupLabels, modeGroups, type ModeGroupKey, tierScores } from "@/lib/modes";
import styles from "./site-shell.module.css";

type SiteShellProps = {
  initialPlayers?: Player[];
};

type ModeFilter = "all" | string;

type RankedPlayer = Player & {
  scopedPoints: number;
  scopedTiers: PlayerTier[];
};

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
  if (mode === "all") {
    return "/Trophy_Icon.png";
  }

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
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const fallbackUrl = getFallbackAvatarUrl(player, size);

    if (event.currentTarget.src !== fallbackUrl) {
      event.currentTarget.src = fallbackUrl;
    }
  };
}

function getPlayerTier(player: Player, mode: string) {
  return player.tiers.find((entry) => entry.gamemode === mode) ?? {
    gamemode: mode,
    tier: "Unknown",
    peak: "Unknown",
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

function getTierNumber(tier: string) {
  const match = tier.match(/[1-5]$/);
  return match ? match[0] : "";
}

function isHighTier(tier: string) {
  return tier.startsWith("HT");
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

function getScopedPoints(player: Player, group: ModeGroupKey) {
  const groupModes = modeGroups[group] as readonly string[];

  return player.tiers
    .filter((entry) => groupModes.includes(entry.gamemode))
    .reduce((sum, entry) => sum + (tierScores[entry.tier] ?? 0), 0);
}

function getScopedTiers(player: Player, group: ModeGroupKey, mode: ModeFilter) {
  if (mode !== "all") {
    return [getPlayerTier(player, mode)];
  }

  const groupModes = modeGroups[group] as readonly string[];

  return sortTiers(
    player.tiers.filter((entry) => groupModes.includes(entry.gamemode) && entry.tier !== "Unknown"),
  );
}

const rowBatchSize = 15;
const globalPlayerLimit = 100;
const maxGlobalTierBadges = 8;
const collapsedGlobalTierBadges = 7;
const maxTierColumnEntries = 20;
const spamWindowMs = 3000;
const spamLoadLimit = 5;
const spamCooldownMs = 2000;

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function SiteShell({ initialPlayers = [] }: SiteShellProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isLoading, setIsLoading] = useState(initialPlayers.length === 0);
  const [loadError, setLoadError] = useState("");
  const [activeGroup, setActiveGroup] = useState<ModeGroupKey>("global");
  const [activeMode, setActiveMode] = useState<ModeFilter>("all");
  const [pendingGroup, setPendingGroup] = useState<ModeGroupKey>("global");
  const [pendingMode, setPendingMode] = useState<ModeFilter>("all");
  const [isRevealing, setIsRevealing] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [visibleRows, setVisibleRows] = useState(rowBatchSize);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const switchTimeout = useRef<number | null>(null);
  const loadAttempts = useRef<number[]>([]);
  const revealTimeout = useRef<number | null>(null);
  const modeScrollerRef = useRef<HTMLDivElement | null>(null);
  const modeTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const debouncedQuery = useDebouncedValue(query, 180);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const showInitialLoading = isLoading && players.length === 0;

  const currentModes = useMemo(() => modeGroups[pendingGroup], [pendingGroup]);
  const visibleModes = useMemo(() => ["all", ...currentModes], [currentModes]);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const activeModeIndex = Math.max(0, visibleModes.indexOf(pendingMode));
  const sliderIndex = Math.min(activeModeIndex, Math.max(0, visibleModes.length - 1));

  const applyFilterChange = (group: ModeGroupKey, mode: ModeFilter) => {
    setActiveGroup(group);
    setActiveMode(mode);
    setVisibleRows(rowBatchSize);
  };

  const revealBoard = () => {
    if (revealTimeout.current) {
      window.clearTimeout(revealTimeout.current);
    }

    setIsRevealing(true);
    revealTimeout.current = window.setTimeout(() => {
      setIsRevealing(false);
      revealTimeout.current = null;
    }, 160);
  };

  const queueFilterChange = (group: ModeGroupKey, mode: ModeFilter) => {
    const now = Date.now();
    loadAttempts.current = [...loadAttempts.current.filter((time) => now - time <= spamWindowMs), now];

    setPendingGroup(group);
    setPendingMode(mode);
    window.requestAnimationFrame(() => {
      modeTabRefs.current[mode]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
    applyFilterChange(group, mode);
    revealBoard();

    if (switchTimeout.current) {
      window.clearTimeout(switchTimeout.current);
      switchTimeout.current = null;
    }

    if (loadAttempts.current.length < spamLoadLimit) {
      return;
    }

    switchTimeout.current = window.setTimeout(() => {
      loadAttempts.current = [];
      switchTimeout.current = null;
    }, spamCooldownMs);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setLoadError("");

    fetchPlayers()
      .then((loadedPlayers) => {
        if (!isCurrent) {
          return;
        }

        setPlayers(loadedPlayers);
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load players.");
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (switchTimeout.current) {
        window.clearTimeout(switchTimeout.current);
      }
      if (revealTimeout.current) {
        window.clearTimeout(revealTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const scroller = modeScrollerRef.current;

    if (!scroller) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      scroller.scrollLeft += event.deltaY || event.deltaX;
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [visibleModes]);

  const rankedPlayers = useMemo(() => {
    return players
      .map((player) => {
        const scopedPoints =
          activeMode === "all"
            ? getScopedPoints(player, activeGroup)
            : tierScores[getPlayerTier(player, activeMode).tier] ?? 0;

        return {
          ...player,
          scopedPoints,
          scopedTiers: getScopedTiers(player, activeGroup, activeMode),
        };
      })
      .filter((player) => player.scopedPoints > 0 || player.scopedTiers.length > 0)
      .sort((left, right) => {
        const pointsDiff = right.scopedPoints - left.scopedPoints;
        if (pointsDiff !== 0) {
          return pointsDiff;
        }

        return left.name.localeCompare(right.name);
      });
  }, [activeGroup, activeMode, players]);

  const isSingleMode = activeMode !== "all";
  const displayPlayers = useMemo(() => {
    return isSingleMode ? rankedPlayers : rankedPlayers.slice(0, globalPlayerLimit);
  }, [isSingleMode, rankedPlayers]);
  const renderedPlayers = useMemo(() => displayPlayers.slice(0, visibleRows), [displayPlayers, visibleRows]);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return players
      .filter((player) => player.name.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 6);
  }, [normalizedQuery, players]);

  useEffect(() => {
    if (!selectedPlayer) {
      return;
    }

    const freshPlayer = players.find((player) => player.uuid === selectedPlayer.uuid) ?? null;
    setSelectedPlayer(freshPlayer);
  }, [players, selectedPlayer]);

  useEffect(() => {
    setVisibleRows(rowBatchSize);
  }, [activeGroup, activeMode]);

  useEffect(() => {
    if (visibleRows >= displayPlayers.length) {
      return;
    }

    const onScroll = () => {
      const distanceFromBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;

      if (distanceFromBottom < 700) {
        setVisibleRows((current) => Math.min(current + rowBatchSize, displayPlayers.length));
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [displayPlayers.length, visibleRows]);

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <section className={styles.header}>
          <div className={styles.brand}>
            <div>
              <h1 className={`display-font ${styles.title}`}>UltraTiers</h1>
            </div>
          </div>

          <div className={styles.headerActions}>
            <label htmlFor="search" className={styles.searchShell}>
              <Search size={17} aria-hidden="true" className={styles.searchIcon} />
              <input
                id="search"
                value={query}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsSearchOpen(false);
                    setQuery("");
                  }, 120);
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setIsSearchOpen(true);
                }}
                placeholder=""
                className={styles.searchInput}
              />

              {query ? (
                <button
                  type="button"
                  className={styles.searchClear}
                  aria-label="Clear search"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    setIsSearchOpen(false);
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}

              {isSearchOpen && searchResults.length > 0 ? (
                <div className={styles.searchDropdown}>
                  {searchResults.map((player) => (
                    <button
                      key={player.uuid}
                      type="button"
                      className={styles.searchResult}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setQuery("");
                        setIsSearchOpen(false);
                      }}
                    >
                      <img
                        src={getAvatarUrl(player, 64)}
                        onError={handleAvatarError(player, 64)}
                        alt={player.name}
                        loading="lazy"
                        decoding="async"
                        className={styles.searchAvatar}
                      />
                      <span>
                        <strong>{player.name}</strong>
                        <small>{player.region}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </label>
          </div>
        </section>

        <section className={styles.rail}>
          <div className={styles.groupTabs}>
            {(Object.keys(modeGroups) as ModeGroupKey[]).map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => queueFilterChange(group, "all")}
                className={`${styles.groupTab} ${pendingGroup === group ? styles.groupTabActive : ""}`}
              >
                {groupLabels[group]}
              </button>
            ))}
            <a href="https://store.ultrapvp.net" target="_blank" rel="noreferrer" className={styles.groupTab}>
              <ShoppingBag size={16} aria-hidden="true" />
              Store
            </a>
          </div>
        </section>
      </nav>

      <section className={styles.boardTabs}>
        <div
          ref={modeScrollerRef}
          className={styles.modeTabs}
          style={
            {
              "--active-index": sliderIndex,
              "--tab-count": visibleModes.length,
            } as React.CSSProperties
          }
        >
          <span className={styles.modeTabSlider} aria-hidden="true" />
          {visibleModes.map((mode) => {
            return (
              <button
                key={mode}
                ref={(element) => {
                  modeTabRefs.current[mode] = element;
                }}
                type="button"
                onClick={() => queueFilterChange(pendingGroup, mode)}
                className={`${styles.modeTab} ${pendingMode === mode ? styles.modeTabActive : ""}`}
              >
                <ModeTabIcon mode={mode} />
                <span className={styles.modeIcon}>
                  <img src={getModeIconPath(mode)} alt="" className={styles.modeIconImage} />
                </span>
                <span className={styles.modeLabel}>{mode === "all" ? "Overall" : mode}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`glass ${styles.board}`}>
        {showInitialLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={22} aria-hidden="true" className={styles.loadingSpinner} />
            <span>Loading players</span>
          </div>
        ) : null}

        {loadError ? <div className={styles.empty}>{loadError}</div> : null}

        {!showInitialLoading ? (
          <div className={`${styles.boardContent} ${isRevealing ? styles.boardContentReveal : ""}`}>
            {isSingleMode ? (
              <TierColumns players={rankedPlayers} mode={activeMode} onSelectPlayer={setSelectedPlayer} />
            ) : (
              <>
            <div className={styles.tableHeader}>
              <div />
              <div>Player</div>
              <div>Region</div>
              <div>Tiers</div>
              <div>Rating</div>
            </div>

            <div className={styles.rows}>
              {renderedPlayers.map((player, index) => (
            <article key={player.uuid} className={styles.row} onClick={() => setSelectedPlayer(player)} role="button" tabIndex={0}>
              <div className={styles.rankCell}>
                <div
                  className={`${styles.rankBadge} ${
                    index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : ""
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              <div className={styles.playerCell}>
                <img
                  src={getAvatarUrl(player, 128)}
                  onError={handleAvatarError(player, 128)}
                  alt={player.name}
                  loading="lazy"
                  decoding="async"
                  className={styles.avatar}
                />
                <div>
                  <div className={styles.playerNameRow}>
                    <h3 className={`display-font ${styles.playerName}`}>{player.name}</h3>
                    {player.nitro ? <span className={styles.nitro}>Nitro</span> : null}
                  </div>
                  <p className={styles.subline}>
                    <img
                      src={index === 0 ? "/Trophy_Icon.png" : "/gamemodes/Sword.png"}
                      alt=""
                      className={styles.sublineIcon}
                    />
                    {index === 0 ? "Combat Master" : `${player.points} points`}
                  </p>
                </div>
              </div>

              <div className={styles.regionCell}>
                <span
                  className={`${styles.regionBadge} ${getRegionClass(player.region)}`}
                >
                  {player.region}
                </span>
              </div>

              <div className={styles.tiersCell}>
                {player.scopedTiers.length > 0 ? (
                  <>
                    {player.scopedTiers
                      .slice(0, player.scopedTiers.length > maxGlobalTierBadges ? collapsedGlobalTierBadges : maxGlobalTierBadges)
                      .map((entry) => (
                      <TierBadge
                        key={`${player.uuid}-${entry.gamemode}`}
                        entry={entry}
                        retired={player.retired_modes?.includes(entry.gamemode)}
                      />
                    ))}
                    {player.scopedTiers.length > maxGlobalTierBadges ? (
                      <div className={styles.tierMore}>+{player.scopedTiers.length - collapsedGlobalTierBadges}</div>
                    ) : null}
                  </>
                ) : (
                  <span className={styles.emptyPill}>Unranked</span>
                )}
              </div>

              <div className={styles.scoreCell}>{player.scopedPoints.toLocaleString()}</div>
            </article>
              ))}

              {visibleRows < displayPlayers.length ? (
            <button
              type="button"
              className={styles.loadMore}
              onClick={() => setVisibleRows((current) => Math.min(current + rowBatchSize, displayPlayers.length))}
            >
              Load more players
            </button>
              ) : null}
            </div>
              </>
            )}
          </div>
        ) : null}

        {!showInitialLoading && rankedPlayers.length === 0 ? <div className={styles.empty}>Nothing matched the current search and filters.</div> : null}
      </section>

      {selectedPlayer ? (
        <PlayerModal
          player={selectedPlayer}
          rank={rankedPlayers.findIndex((player) => player.uuid === selectedPlayer.uuid) + 1}
          onClose={() => setSelectedPlayer(null)}
        />
      ) : null}
    </main>
  );
}

function ModeTabIcon({ mode }: { mode: string }) {
  if (mode === "all") {
    return <Trophy size={15} aria-hidden="true" className={styles.modeTabGlyph} />;
  }

  return <img src={getModeIconPath(mode)} alt="" className={styles.modeTabImage} />;
}

function TierColumns({
  players,
  mode,
  onSelectPlayer,
}: {
  players: RankedPlayer[];
  mode: string;
  onSelectPlayer: (player: Player) => void;
}) {
  const columns = useMemo(() => {
    return [1, 2, 3, 4, 5].map((tierNumber) => {
      const entries = players
        .map((player) => ({
          player,
          tier: getPlayerTier(player, mode).tier,
        }))
        .filter(({ tier }) => getTierNumber(tier) === tierNumber.toString())
        .sort((left, right) => {
          const tierDiff = (tierScores[right.tier] ?? 0) - (tierScores[left.tier] ?? 0);
          if (tierDiff !== 0) {
            return tierDiff;
          }

          return left.player.name.localeCompare(right.player.name);
        })
        .slice(0, maxTierColumnEntries);

      return { tierNumber, entries };
    });
  }, [mode, players]);

  return (
    <div className={styles.tierColumns}>
      {columns.map((column) => (
        <section key={column.tierNumber} className={styles.tierColumn}>
          <div className={`${styles.tierColumnHeader} ${styles[`tierColumnHeader${column.tierNumber}`] ?? ""}`}>
            {column.tierNumber <= 3 ? <Trophy size={25} aria-hidden="true" /> : null}
            <span>Tier {column.tierNumber}</span>
          </div>

          <div className={styles.tierColumnRows}>
            {column.entries.map(({ player, tier }) => (
              <button
                key={`${player.uuid}-${mode}`}
                type="button"
                className={`${styles.tierColumnRow} ${getRegionClass(player.region)}`}
                data-region={player.region || "Unknown"}
                onClick={() => onSelectPlayer(player)}
              >
                <span className={styles.tierColumnAccent} />
                <img
                  src={getAvatarUrl(player, 64)}
                  onError={handleAvatarError(player, 64)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={styles.tierColumnAvatar}
                />
                <span className={styles.tierColumnName}>{player.name}</span>
                {isHighTier(tier) ? (
                  <ChevronsUp size={19} aria-label="High tier" className={styles.tierArrow} />
                ) : (
                  <ChevronUp size={19} aria-label="Low tier" className={styles.tierArrow} />
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
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

function PlayerModal({
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
          ×
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
