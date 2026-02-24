const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes 
} = require('discord.js');

const http = require('http');

// Servidor para manter Railway ativo
http.createServer((req, res) => {
  res.write('Bot operacional');
  res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

let players = [];
let score = {
  alpha: 0,
  bravo: 0
};

// ===== REGISTRAR SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('entrar')
    .setDescription('Alistar-se na operação'),

  new SlashCommandBuilder()
    .setName('lista')
    .setDescription('Ver soldados alistados'),

  new SlashCommandBuilder()
    .setName('sortear')
    .setDescription('Iniciar divisão estratégica')
    .addStringOption(option =>
      option.setName('timea')
        .setDescription('Nome do Time A')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('timeb')
        .setDescription('Nome do Time B')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('vitoria')
    .setDescription('Registrar vitória')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Qual time venceu')
        .setRequired(true)
        .addChoices(
          { name: 'Alpha', value: 'alpha' },
          { name: 'Bravo', value: 'bravo' }
        )),

  new SlashCommandBuilder()
    .setName('placar')
    .setDescription('Ver placar geral'),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resetar operação')
].map(command => command.toJSON());

client.once('clientReady', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Slash commands registrados.');
  } catch (error) {
    console.error(error);
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ENTRAR
  if (interaction.commandName === 'entrar') {
    if (!players.includes(interaction.user.id)) {
      players.push(interaction.user.id);
      await interaction.reply(`Soldado ${interaction.user.username} alistado.`);
    } else {
      await interaction.reply('Você já está na operação.');
    }
  }

  // LISTA
  if (interaction.commandName === 'lista') {
    if (players.length === 0) {
      await interaction.reply('Nenhum soldado alistado.');
      return;
    }

    const nomes = players.map(id => {
      const member = interaction.guild.members.cache.get(id);
      return member ? member.user.username : 'Desconhecido';
    });

    await interaction.reply(`Soldados ativos:\n${nomes.join('\n')}`);
  }

  // SORTEAR
  if (interaction.commandName === 'sortear') {
    if (players.length < 2) {
      await interaction.reply('Necessário mínimo de 2 soldados.');
      return;
    }

    if (players.length % 2 !== 0) {
      await interaction.reply('Número ímpar detectado. Operação cancelada.');
      return;
    }

    const nomeA = interaction.options.getString('timea');
    const nomeB = interaction.options.getString('timeb');

    const shuffled = [...players].sort(() => Math.random() - 0.5);

    const teamA = shuffled.filter((_, i) => i % 2 === 0);
    const teamB = shuffled.filter((_, i) => i % 2 !== 0);

    const formatTeam = (team) =>
      team.map(id => {
        const member = interaction.guild.members.cache.get(id);
        return member ? member.user.username : 'Desconhecido';
      }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Operação Iniciada')
      .setDescription('Divisão estratégica concluída')
      .addFields(
        { name: `Unidade ${nomeA}`, value: formatTeam(teamA), inline: true },
        { name: `Unidade ${nomeB}`, value: formatTeam(teamB), inline: true }
      )
      .setFooter({ text: 'Preparem-se para o combate.' });

    players = [];

    await interaction.reply({ embeds: [embed] });
  }

  // VITÓRIA
  if (interaction.commandName === 'vitoria') {
    const vencedor = interaction.options.getString('time');
    score[vencedor]++;
    await interaction.reply(`Vitória registrada para ${vencedor.toUpperCase()}.`);
  }

  // PLACAR
  if (interaction.commandName === 'placar') {
    await interaction.reply(
      `Placar Geral\nAlpha: ${score.alpha}\nBravo: ${score.bravo}`
    );
  }

  // RESET
  if (interaction.commandName === 'reset') {
    players = [];
    score = { alpha: 0, bravo: 0 };
    await interaction.reply('Operação completamente reiniciada.');
  }
});

client.login(process.env.TOKEN);
