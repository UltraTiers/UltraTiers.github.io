import express from "express";
import cors from "cors";
import path from "path";
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

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// -------------------
// Helper Functions
// -------------------
async function loadPlayers() {
  try {
    const { data, error } = await supabase.from("ultratiers").select("*");
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error loading players:", err);
    return [];
  }
}

async function saveOrUpdatePlayer(player) {
  const { uuid, name, region, tiers, points, nitro } = player;

  const { data: existing, error } = await supabase
    .from("ultratiers")
    .select("*")
    .eq("uuid", uuid)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    const { error: updateError } = await supabase
      .from("ultratiers")
      .update({ name, region, tiers, points, nitro: nitro || false })
      .eq("uuid", uuid);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("ultratiers")
      .insert([{ uuid, name, region, tiers, points, nitro: nitro || false }]);

    if (insertError) throw insertError;
  }
}

// -------------------
// Default tiers order
// -------------------
const allGamemodes = [
  "Axe","Sword","Bow","Vanilla","NethOP","Pot","UHC","SMP","Mace","Diamond SMP",
  "OG Vanilla","Bed","DeBuff","Speed","Manhunt","Elytra","Diamond Survival","Minecart",
  "Creeper","Trident","AxePot","Pearl","Bridge","Sumo","OP"
];

const tierPointsMap = { LT5:1, HT5:2, LT4:4, HT4:6, LT3:9, HT3:12, LT2:16, HT2:20, LT1:25, HT1:30 };

// -------------------
// API Endpoints
// -------------------
app.get("/health", (req, res) => res.send("API is running!"));

app.get("/players", async (req, res) => {
  try {
    const players = await loadPlayers();

    const updatedPlayers = players.map(p => {
      const tiersMap = {};
      if (Array.isArray(p.tiers)) {
        p.tiers.forEach(t => { tiersMap[t.gamemode] = t.tier; });
      }
      const fullTiers = allGamemodes.map(g => ({
        gamemode: g,
        tier: tiersMap[g] || "Unknown"
      }));
      const points = fullTiers.reduce((sum, t) => sum + (tierPointsMap[t.tier] || 0), 0);
      return { ...p, tiers: fullTiers, points, nitro: p.nitro || false };
    });

    res.json(updatedPlayers);
  } catch (err) {
    console.error("Error in GET /players:", err);
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
        tier: g === gamemode ? newTier : "Unknown"
      }));
      player = { uuid, name, region, tiers, points: tierPointsMap[newTier] || 0, nitro: false };
    } else {
      const tierObj = player.tiers.find(t => t.gamemode === gamemode);
      if (tierObj) tierObj.tier = newTier;
      else player.tiers.push({ gamemode, tier: newTier });

      if (name) player.name = name;
      if (region) player.region = region;

      allGamemodes.forEach(g => {
        if (!player.tiers.find(t => t.gamemode === g)) {
          player.tiers.push({ gamemode: g, tier: "Unknown" });
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
        region: null,
        tiers: allGamemodes.map(g => ({ gamemode: g, tier: "Unknown" })),
        points: 0,
        nitro: true
      };
    } else {
      player.nitro = true;
      if (name) player.name = name;
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
