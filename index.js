const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

let players = [];

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ENTRAR NA LISTA
  if (message.content === '!entrar') {
    if (!players.includes(message.author.id)) {
      players.push(message.author.id);
      message.channel.send(`${message.author.username} entrou na operação.`);
    } else {
      message.channel.send('Você já está na lista.');
    }
  }

  // VER LISTA
  if (message.content === '!lista') {
    if (players.length === 0) {
      message.channel.send('Nenhum jogador alistado.');
      return;
    }

    const nomes = players.map(id => {
      const member = message.guild.members.cache.get(id);
      return member ? member.user.username : 'Desconhecido';
    });

    message.channel.send(`Jogadores:\n${nomes.join('\n')}`);
  }

  // SORTEAR TIMES
  if (message.content === '!sortear') {
    if (players.length < 2) {
      message.channel.send('Precisa de pelo menos 2 jogadores.');
      return;
    }

    const shuffled = [...players].sort(() => Math.random() - 0.5);

    const teamA = shuffled.filter((_, i) => i % 2 === 0);
    const teamB = shuffled.filter((_, i) => i % 2 !== 0);

    const formatTeam = (team) =>
      team.map(id => {
        const member = message.guild.members.cache.get(id);
        return member ? member.user.username : 'Desconhecido';
      }).join('\n');

    message.channel.send(
`========================
TIME A
${formatTeam(teamA)}

TIME B
${formatTeam(teamB)}
========================`
    );

    players = [];
  }

  // RESET
  if (message.content === '!reset') {
    players = [];
    message.channel.send('Lista reiniciada.');
  }
});

client.login(process.env.TOKEN);
