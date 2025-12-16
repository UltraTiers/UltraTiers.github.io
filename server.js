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

// Store token for later Minecraft verification
app.post("/verify", async (req, res) => {
  try {
    const { discord_id, token, expires_at } = req.body;
    if (!discord_id || !token || !expires_at)
      return res.status(400).json({ error: "Missing fields" });

    // Insert into verification table
    const { error } = await supabase
      .from("minecraft_verifications")
      .insert({
        discord_id,
        token,
        expires_at
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to store verification token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Map your HT role IDs
const TIER_ROLE_IDS = {
  HT1: "1450503836069396530",
  LT1: "1450503757849956433",
  HT2: "1450503687326662686",
  LT2: "1450503543873208423",
  HT3: "1450503473991913546"
};

// Endpoint for Minecraft server to verify token and assign roles
app.post("/verify/minecraft", async (req, res) => {
  try {
    const { token, mcUUID } = req.body;

    if (!token || !mcUUID)
      return res.status(400).json({ error: "Missing token or mcUUID" });

    // Step 1: Get verification record
    const { data, error } = await supabase
      .from("minecraft_verifications")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(400).json({ error: "Invalid token" });
    if (data.expires_at < Date.now()) return res.status(400).json({ error: "Token expired" });

    const discordId = data.discord_id;

    // Step 2: Upsert verified player
    const { error: upsertError } = await supabase
      .from("minecraft_verified")
      .upsert({ discord_id: discordId, mc_uuid: mcUUID }, { onConflict: ["discord_id"] });

    if (upsertError) throw upsertError;

    // Step 3: Remove used token
    await supabase
      .from("minecraft_verifications")
      .delete()
      .eq("token", token);

    // Step 4: Fetch Minecraft username
    let mcName;
    try {
      const resp = await axios.get(`https://api.mojang.com/user/profiles/${mcUUID}/names`);
      mcName = resp.data?.[resp.data.length - 1]?.name;
    } catch (err) {
      console.warn("Failed to fetch Minecraft username:", err);
    }

    if (!mcName) {
      return res.status(200).json({ success: true, discord_id: discordId, warning: "Could not fetch Minecraft username" });
    }

    // Step 5: Fetch player data from website
    let playerData;
    try {
      const resp = await axios.get("https://ultratiers.onrender.com/players");
      playerData = resp.data.find(p => p.uuid === mcUUID);
    } catch (err) {
      console.warn("Failed to fetch player data:", err);
    }

    // Step 6: Assign role if HT3+ exists
    if (playerData?.tiers?.some(t => t.tier === "HT3")) {
      const guild = client.guilds.cache.get("1446486795566190753"); // your guild
      if (guild) {
        const member = guild.members.cache.get(discordId);
        if (member && !member.roles.cache.has(TIER_ROLE_IDS.HT3)) {
          await member.roles.add(TIER_ROLE_IDS.HT3).catch(err => {
            console.error("Failed to assign role:", err);
          });
        }
      }
    }

    res.json({ success: true, discord_id: discordId });

  } catch (err) {
    console.error("Minecraft verification failed:", err);
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
