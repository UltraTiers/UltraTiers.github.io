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
const supabaseUrl = process.env.SUPABASE_URL; // e.g., "https://wrudkpbbxmnfdpbirumh.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY; // your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// -------------------
// Helper Functions
// -------------------
async function loadPlayers() {
  const { data, error } = await supabase.from("players").select("*");
  if (error) throw error;
  return data;
}

async function saveOrUpdatePlayer(player) {
  const { uuid, name, region, tiers, points } = player;

  const { data: existing } = await supabase
    .from("players")
    .select("*")
    .eq("uuid", uuid)
    .single();

  if (existing) {
    await supabase
      .from("players")
      .update({ name, region, tiers, points })
      .eq("uuid", uuid);
  } else {
    await supabase
      .from("players")
      .insert([{ uuid, name, region, tiers, points }]);
  }
}

// -------------------
// API Endpoints
// -------------------

// Health check
app.get("/health", (req, res) => res.send("API is running!"));

// Get all players
app.get("/players", async (req, res) => {
  const players = await loadPlayers();
  res.json(players);
});

// Update/add player (POST from Discord bot)
app.post("/", async (req, res) => {
  const { uuid, gamemode, newTier, name = null, region = null } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });
  }

  let players = await loadPlayers();
  let player = players.find(p => p.uuid === uuid);

  if (!player) {
    // New player
    player = { uuid, name, region, tiers: [{ gamemode, tier: newTier }], points: 0 };
  } else {
    // Update existing player
    const tierObj = player.tiers.find(t => t.gamemode === gamemode);
    if (tierObj) tierObj.tier = newTier;
    else player.tiers.push({ gamemode, tier: newTier });

    if (name) player.name = name;
    if (region) player.region = region;
  }

  // Recalculate points
  const tierPointsMap = {
    LT5: 1, HT5: 2, LT4: 4, HT4: 6,
    LT3: 9, HT3: 12, LT2: 16, HT2: 20,
    LT1: 25, HT1: 30
  };
  player.points = player.tiers.reduce((sum, t) => {
    if (!t.tier || t.tier === "Unknown") return sum;
    return sum + (tierPointsMap[t.tier] || 0);
  }, 0);

  // Save/update in Supabase
  await saveOrUpdatePlayer(player);
  return res.json({ message: "Player updated successfully", player });
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
