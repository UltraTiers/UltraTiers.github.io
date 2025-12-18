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
  const { uuid, name, region, tiers, points, nitro, banner } = player;

  const { data: existing, error } = await supabase
    .from("ultratiers")
    .select("*")
    .eq("uuid", uuid)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    const { error: updateError } = await supabase
      .from("ultratiers")
      .update({
        name,
        region,
        tiers,
        points,
        nitro: nitro || false,
        banner: banner || existing.banner || "anime-style-clouds.jpg"
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
        tiers,
        points,
        nitro: nitro || false,
        banner: banner || "anime-style-clouds.jpg"
      }]);

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
  "Axe","Sword","Bow","Vanilla","NethOP","Pot","UHC","SMP","Mace","Diamond SMP",
  "OG Vanilla","Bed","DeBuff","Speed","Manhunt","Elytra","Diamond Survival","Minecart",
  "Creeper","Trident","AxePot","Pearl","Bridge","Sumo","OP"
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
      if (Array.isArray(p.tiers)) {
        p.tiers.forEach(t => { tiersMap[t.gamemode] = t.tier; });
      }
      const fullTiers = allGamemodes.map(g => ({
        gamemode: g,
        tier: tiersMap[g] || "Unknown"
      }));
      const points = fullTiers.reduce((sum, t) => sum + (tierPointsMap[t.tier] || 0), 0);
      return {
  ...p,
  tiers: fullTiers,
  points,
  nitro: p.nitro || false,
  banner: p.banner || "anime-style-clouds.jpg"
};
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
        tiers: allGamemodes.map(g => ({ gamemode: g, tier: "Unknown" })),
        points: 0,
        nitro: true
      };
    } else {
      player.nitro = true;
      if (name) player.name = name;

      // Ensure tiers exist
      if (!Array.isArray(player.tiers) || player.tiers.length === 0) {
        player.tiers = allGamemodes.map(g => ({ gamemode: g, tier: "Unknown" }));
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
