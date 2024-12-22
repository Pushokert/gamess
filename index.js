const {
    Warrior, Archer, Mage, Dwarf, Crossbowman, Demiurge,
    play
  } = require('./rpg.js');
  
  // Создаём нескольких игроков
  const player1 = new Warrior(0, "Алёша Попович");
  const player2 = new Archer(2, "Леголас");
  const player3 = new Mage(4, "Гендальф");
  const player4 = new Dwarf(1, "Гномыч");
  const player5 = new Crossbowman(3, "Арбалетный Мастер");
  const player6 = new Demiurge(5, "Великий Демиург");
  
  const allPlayers = [player1, player2, player3, player4, player5, player6];
  
  // Запускаем бой
  play(allPlayers);

  