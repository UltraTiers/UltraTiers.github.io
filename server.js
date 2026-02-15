import express from "express";
import cors from "cors";
import path from "path";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd())));

// -------------------
// Supabase setup
// -------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
let supabaseConfigured = false;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  supabaseConfigured = true;
  console.log("✅ Supabase connected");
} else {
  console.warn("⚠️ Supabase not configured. Using demo mode with empty data.");
}

// -------------------
// Helper Functions
// -------------------
async function loadPlayers() {
  if (!supabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase.from("ultratiers").select("*");
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error loading players:", err);
    return [];
  }
}

// -------------------
// Add or update tester
// -------------------
async function addOrUpdateTester({ uuid, name, mode, region, category }) {
  try {
    // Fetch existing tester
    const { data: existing, error: fetchError } = await supabase
      .from("testers")
      .select("*")
      .eq("uuid", uuid)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Ensure mode is always an array
    const newModes = Array.isArray(mode) ? mode : [mode];

    if (existing) {
      // Merge existing modes with new ones
      const existingModes = Array.isArray(existing.mode)
        ? existing.mode
        : [];

      const mergedModes = Array.from(
        new Set([...existingModes, ...newModes])
      );

      const { error: updateError } = await supabase
        .from("testers")
        .update({
          name,
          region,
          mode: mergedModes,   // ✅ FIXED
          category: category || existing.category
        })
        .eq("uuid", uuid);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("testers")
        .insert([
          {
            uuid,
            name,
            region,
            mode: newModes,     // ✅ FIXED
            category: category || "subtester"  // default to subtester
          }
        ]);

      if (insertError) throw insertError;
    }
  } catch (err) {
    console.error("addOrUpdateTester failed:", err);
    throw new Error("Failed to add/update tester");
  }
}

// -------------------
// TESTERS API
// -------------------
app.post("/testers", async (req, res) => {
  try {
    const { uuid, name, mode, region, category } = req.body;

    if (!uuid || !name || !mode || !region) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await addOrUpdateTester({ uuid, name, mode, region, category });
    res.json({ success: true });
  } catch (err) {
    console.error("Error adding/updating tester:", err);
    res.status(500).json({ error: "Failed to add/update tester" });
  }
});

app.get("/testers", async (req, res) => {
  try {
    if (!supabaseConfigured) {
      return res.json([]);
    }

    const { data, error } = await supabase.from("testers").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Failed to load testers:", err);
    res.status(500).json({ error: "Failed to load testers" });
  }
});

app.get("/testers/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;

    const { data, error } = await supabase
      .from("testers")
      .select("*")
      .eq("uuid", uuid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Tester not found" });

    res.json(data);
  } catch (err) {
    console.error("Failed to fetch tester:", err);
    res.status(500).json({ error: "Failed to fetch tester" });
  }
});

// -------------------
// Add or update a build player
// -------------------
app.post("/buildplayer", async (req, res) => {
  try {
    const { uuid, name, region, buildRank } = req.body;

    if (!uuid || !name || !buildRank) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const playerObj = {
      uuid,
      name,
      region: region || "Unknown",
      buildRank
    };

    const { error } = await supabase
      .from("building_players")
      .upsert(playerObj, { onConflict: "uuid" });

    if (error) {
      console.error("Failed to save build player:", error);
      return res.status(500).json({ success: false });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error in /buildplayer:", err);
    return res.status(500).json({ success: false });
  }
});

app.get("/building_players", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("building_players")
      .select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Failed to load building players:", err);
    res.status(500).json({ error: "Failed to load building players" });
  }
});

async function saveOrUpdatePlayer(player) {
  const { uuid, name, region, tiers, points, nitro, banner } = player;

  const { data: existing, error } = await supabase
    .from("ultratiers")
    .select("*")
    .eq("uuid", uuid)
    .maybeSingle();

  if (error) throw error;

  // Ensure tiers entries include a `peak` field defaulting to the current tier
  const normalizedTiers = Array.isArray(tiers)
    ? tiers.map(t => ({
        gamemode: t.gamemode,
        tier: t.tier,
        peak: t.peak || t.tier
      }))
    : [];

  if (existing) {
    const { error: updateError } = await supabase
      .from("ultratiers")
      .update({
        name,
        region,
        tiers: normalizedTiers,
        points,
        nitro: nitro || false,
        banner: banner || existing.banner || "anime-style-stone.jpg"
      })
      .eq("uuid", uuid);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("ultratiers")
      .insert([{
        uuid,
        name,
        region,
        tiers: normalizedTiers,
        points,
        nitro: nitro || false,
        banner: banner || "anime-style-stone.jpg"
      }] );

    if (insertError) throw insertError;
  }
}

app.post("/profile/banner", async (req, res) => {
  try {
    const { uuid, banner } = req.body;
    if (!uuid || !banner)
      return res.status(400).json({ error: "Missing uuid or banner" });

    const { error } = await supabase
      .from("ultratiers")
      .update({ banner })
      .eq("uuid", uuid);

    if (error) throw error;

    res.json({ success: true, banner });
  } catch (err) {
    console.error("Banner update failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/apply", async (req, res) => {
  try {
    const { discord, ign, modes, reason, region } = req.body;

    if (!discord || !ign || !modes || !reason || !region) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const webhook = process.env.DISCORD_APPLICATION_WEBHOOK;
    if (!webhook) {
      throw new Error("Webhook not configured");
    }

    // Combine all info into a single vertical column using description
    const embed = {
      title: "📝 New Tester Application",
      color: 0x5865f2,
      description: 
        `**Discord:** ${discord}\n` +
        `**Minecraft IGN:** ${ign}\n` +
        `**Region:** ${region}\n` +
        `**Modes:** ${modes}\n` +
        `**Reason:** ${reason}`,
      timestamp: new Date().toISOString()
    };

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "UltraTiers Applications",
        embeds: [embed]
      })
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Application submit failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------
// Default tiers order
// -------------------
const allGamemodes = [
  "Axe","Sword","Bow","Vanilla","NethOP","Pot","UHC","SMP","Mace","Spear Mace","Diamond SMP",
  "OG Vanilla","Bed","DeBuff","Speed","Manhunt","Elytra","Spear Elytra","Diamond Survival","Minecart",
  "Creeper","Trident","AxePot","Pearl","Bridge","Sumo","OP","Pufferfish",
];

const tierPointsMap = { LT5:1, HT5:2, LT4:4, HT4:6, LT3:9, HT3:12, LT2:16, HT2:20, LT1:25, HT1:30 };

function generateLoginCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------
// API Endpoints
// -------------------
app.get("/health", (req, res) => res.send("API is running!"));

app.get("/players", async (req, res) => {
  try {
    const players = await loadPlayers();

    const updatedPlayers = players.map(p => {
      const tiersMap = {};
      const peakMap = {};
      if (Array.isArray(p.tiers)) {
        p.tiers.forEach(t => {
          tiersMap[t.gamemode] = t.tier;
          peakMap[t.gamemode] = t.peak || t.tier;
        });
      }
      const fullTiers = allGamemodes.map(g => ({
        gamemode: g,
        tier: tiersMap[g] || "Unknown",
        peak: peakMap[g] || (tiersMap[g] || "Unknown")
      }));
      const points = fullTiers.reduce((sum, t) => sum + (tierPointsMap[t.tier] || 0), 0);
      return {
        ...p,
        tiers: fullTiers,
        points,
        nitro: p.nitro || false,
        banner: p.banner || "anime-style-stone.jpg",
        retired_modes: Array.isArray(p.retired_modes) ? p.retired_modes : []
      };
    });

    res.json(updatedPlayers);
  } catch (err) {
    console.error("Error in GET /players:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/retire", async (req, res) => {
  try {
    const { ign, mode } = req.body;
    if (!ign || !mode) return res.status(400).json({ error: "Missing ign or mode" });

    const { data: player, error } = await supabase
      .from("ultratiers")
      .select("retired_modes")
      .eq("name", ign)
      .maybeSingle();

    if (error) throw error;
    if (!player) return res.status(404).json({ error: "Player not found" });

    const retired = Array.isArray(player.retired_modes) ? player.retired_modes : [];

    if (!retired.includes(mode)) retired.push(mode);

    const { error: updateError } = await supabase
      .from("ultratiers")
      .update({ retired_modes: retired })
      .eq("name", ign);

    if (updateError) throw updateError;

    res.json({ success: true, retired_modes: retired });
  } catch (err) {
    console.error("Retire failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// -------------------
// Update or add player tiers
// -------------------
app.post("/", async (req, res) => {
  try {
    const { uuid, gamemode, newTier, name = null, region = null } = req.body;
    if (!uuid || !gamemode || !newTier) return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });

    let players = await loadPlayers();
    let player = players.find(p => p.uuid === uuid);

    if (!player) {
      const tiers = allGamemodes.map(g => ({
        gamemode: g,
        tier: g === gamemode ? newTier : "Unknown",
        peak: g === gamemode ? newTier : "Unknown"
      }));
      player = { uuid, name, region, tiers, points: tierPointsMap[newTier] || 0, nitro: false };
    } else {
      const tierObj = player.tiers.find(t => t.gamemode === gamemode);
      const newTierPoints = tierPointsMap[newTier] || 0;

      if (tierObj) {
        // update current tier
        const prevTier = tierObj.tier;
        tierObj.tier = newTier;

        // existing peak (fallback to previous tier or current if missing)
        const existingPeak = tierObj.peak || prevTier || newTier;
        const existingPeakPoints = tierPointsMap[existingPeak] || 0;

        // update peak only if this newTier is higher than existing peak
        if (newTierPoints > existingPeakPoints) {
          tierObj.peak = newTier;
        }
      } else {
        // push new entry with peak equal to the tier
        player.tiers.push({ gamemode, tier: newTier, peak: newTier });
      }

      if (name) player.name = name;
      if (region) player.region = region;

      allGamemodes.forEach(g => {
        if (!player.tiers.find(t => t.gamemode === g)) {
          player.tiers.push({ gamemode: g, tier: "Unknown", peak: "Unknown" });
        }
      });

      player.points = player.tiers.reduce((sum, t) => sum + (tierPointsMap[t.tier] || 0), 0);
    }

    await saveOrUpdatePlayer(player);
    return res.json({ message: "Player updated successfully", player });
  } catch (err) {
    console.error("Error in POST /:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/code", async (req, res) => {
  try {
    const { ign } = req.body;
    if (!ign) return res.status(400).json({ error: "Missing IGN" });

    // Fetch player
    const { data: player, error } = await supabase
      .from("ultratiers")
      .select("login")
      .eq("name", ign)
      .maybeSingle();

    if (error) throw error;
    if (!player) return res.status(404).json({ error: "Player not found" });

    // If login code already exists, return it
    if (player.login) {
      return res.json({ login: player.login });
    }

    // Generate new code
    const code = generateLoginCode();

    const { error: updateError } = await supabase
      .from("ultratiers")
      .update({ login: code })
      .eq("name", ign);

    if (updateError) throw updateError;

    return res.json({ login: code });
  } catch (err) {
    console.error("Error in /code:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { ign, code } = req.body; // only IGN and code

  if (!ign || !code) return res.status(400).json({ error: "Missing IGN or code" });

  const { data: player, error } = await supabase
    .from("ultratiers")
    .select("*")
    .eq("name", ign)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Database error" });
  if (!player || player.login !== code) return res.status(401).json({ error: "Invalid login code" });

  // No JWT, just return player info
  res.json({ success: true, ign: player.name, uuid: player.uuid });
});

// -------------------
// Rate a builder
// -------------------
app.post("/builders/rate", async (req, res) => {
  try {
    const {
      uuid,
      name,
      region,
      composition,
      buildings,
      organics,
      terrain,
      details,
      colouring
    } = req.body;

    if (
      !uuid ||
      !composition ||
      !buildings ||
      !organics ||
      !terrain ||
      !details ||
      !colouring
    ) {
      return res.status(400).json({ error: "Missing rating fields" });
    }

    const ratings = {
      Composition: composition,
      Buildings: buildings,
      Organics: organics,
      Terrain: terrain,
      Details: details,
      Colouring: colouring
    };

    await saveOrUpdateBuilderRatings({ uuid, name, region, ratings });

    res.json({ success: true, ratings });
  } catch (err) {
    console.error("Builder rating failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------
// Save or update builder ratings
// -------------------
async function saveOrUpdateBuilderRatings({ uuid, name, region, ratings }) {
  const tierPointsMap = { LT5:1, HT5:2, LT4:4, HT4:6, LT3:9, HT3:12, LT2:16, HT2:20, LT1:25, HT1:30 };

  // Calculate points from all 3 ratings
  const points = Object.values(ratings).reduce(
    (sum, tier) => sum + (tierPointsMap[tier] || 0),
    0
  );

  const { data: existing, error } = await supabase
    .from("builders")
    .select("*")
    .eq("uuid", uuid)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    const { error: updateError } = await supabase
      .from("builders")
      .update({
        name,
        region,
        tiers: ratings,
        points
      })
      .eq("uuid", uuid);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("builders")
      .insert([{
        uuid,
        name,
        region,
        tiers: ratings,
        points
      }]);

    if (insertError) throw insertError;
  }
}

app.get("/builders", async (req, res) => {
  try {
    if (!supabaseConfigured) {
      return res.json([]);
    }

    const { data, error } = await supabase.from("builders").select("*");
    if (error) throw error;

    const normalized = data.map(b => {
      let tiersObj = {};

      // Case 1: array format
      if (Array.isArray(b.tiers)) {
        b.tiers.forEach(t => {
          if (t.subject && t.tier) {
            tiersObj[t.subject] = t.tier;
          }
        });
      }

      // Case 2: already object
      else if (b.tiers && typeof b.tiers === "object") {
        tiersObj = b.tiers;
      }

      return {
        ...b,
        tiers: tiersObj
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("Failed to load builders:", err);
    res.status(500).json({ error: "Failed to load builders" });
  }
});

// -------------------
// Grant Nitro styling
// -------------------
app.post("/nitro", async (req, res) => {
  try {
    const { uuid, name, nitro } = req.body;
    if (!uuid || !name || nitro !== true) 
      return res.status(400).json({ error: "Missing uuid, name, or nitro flag" });

    let players = await loadPlayers();
    let player = players.find(p => p.uuid === uuid);

    if (!player) {
      player = {
        uuid,
        name,
        region: "Unknown", // avoid null
        tiers: allGamemodes.map(g => ({ gamemode: g, tier: "Unknown", peak: "Unknown" })),
        points: 0,
        nitro: true
      };
    } else {
      player.nitro = true;
      if (name) player.name = name;

      // Ensure tiers exist
      if (!Array.isArray(player.tiers) || player.tiers.length === 0) {
        player.tiers = allGamemodes.map(g => ({ gamemode: g, tier: "Unknown", peak: "Unknown" }));
      }

      // Ensure points are calculated
      player.points = player.tiers.reduce((sum, t) => sum + (tierPointsMap[t.tier] || 0), 0);
    }

    await saveOrUpdatePlayer(player);
    return res.json({ message: `${name} has been granted Nitro styling!`, player });
  } catch (err) {
    console.error("Error in POST /nitro:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// -------------------
// Global error handling
// -------------------
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// -------------------
// Start Server
// -------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));