import { Client, GatewayIntentBits } from "discord.js";
import express from "express";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_KEY = process.env.ROBLOX_MSG_KEY;
const UNIVERSE_ID = "5099257584";
const TOPIC = "DiscordAdmin";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once("ready", () => {
  console.log(`Discord logged as ${client.user.tag}`);
});

client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.startsWith("!")) return;

  if (m.content === "!online") {
    try {
      const r = await fetch(`https://games.roblox.com/v1/games/${UNIVERSE_ID}/servers/Public?limit=100`);
      const j = await r.json();
      let ids = [];
      let total = 0;
      for (const s of (j.data || [])) {
        total += s.playing || 0;
        ids.push(...(s.playerIds || []));
      }
      ids = ids.slice(0, 100);
      let names = [];
      if (ids.length) {
        const u = await fetch("https://users.roblox.com/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: ids, excludeBannedUsers: false })
        });
        const uj = await u.json();
        names = (uj.data || []).map(x => x.displayName && x.displayName !== x.name ? `${x.displayName} (@${x.name})` : `@${x.name}`);
      }
      m.reply(`Онлайн: ${total}\n` + (names.join(", ") || "пусто"));
    } catch (e) {
      console.log("online error:", e.message);
      m.reply("Не смог получить онлайн: " + e.message);
    }
    return;
  }

  const adonisCmd = ":" + m.content.slice(1);
  console.log(`Discord: ${m.content} -> ${adonisCmd}`);
  try {
    const r = await fetch(`https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}:publishMessage`, {
      method: "POST",
      headers: { "x-api-key": ROBLOX_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ topic: TOPIC, message: JSON.stringify({ cmd: adonisCmd }) })
    });
    const t = await r.text();
    console.log(`Roblox ответ: ${r.status} ${t}`);
    m.reply(`Отправил в игру: \`${adonisCmd}\` (roblox:${r.status})`);
  } catch(e) {
    console.log("Fetch error:", e.message);
    m.reply("Ошибка отправки: " + e.message);
  }
});

client.login(DISCORD_TOKEN);

const app = express();
app.get("/", (_, r) => r.send("discord bridge ok"));
app.listen(process.env.PORT || 3000, () => console.log("web ok"));
