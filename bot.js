import { Client, GatewayIntentBits } from "discord.js";
import express from "express";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_KEY = process.env.ROBLOX_MSG_KEY; // новый ключ только с universe-messaging:publish
const UNIVERSE_ID = "ТВОЙ_UNIVERSE_ID";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.startsWith("!")) return;
  const adonisCmd = ":" + m.content.slice(1); // !kill Bodya -> :kill Bodya

  await fetch(`https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/topics/DiscordAdmin:publish`, {
    method: "POST",
    headers: { "x-api-key": ROBLOX_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ message: JSON.stringify({ cmd: adonisCmd }) })
  });
  m.reply(`Отправил в игру: \`${adonisCmd}\``);
});
client.login(DISCORD_TOKEN);

// чтобы Render Free не спал
const app = express();
app.get("/", (_,r)=>r.send("discord bridge ok"));
app.listen(process.env.PORT || 3000);
