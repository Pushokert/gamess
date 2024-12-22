/////////////////////////////////////////////////
//   ОРУЖИЕ (Weapon) и его наследники
/////////////////////////////////////////////////

class Weapon {
    constructor(name, attack, durability, range) {
      this.name = name;
      this.attack = attack;
      this.durability = durability;
      this.initDurability = durability;
      this.range = range;
    }
  
    takeDamage(damage) {
      if (this.durability === Infinity) {
        return;
      }
      this.durability -= damage;
      if (this.durability < 0) {
        this.durability = 0;
      }
    }
  
    getDamage() {
      if (this.durability <= 0) {
        return 0;
      }
      const threshold = 0.3 * this.initDurability;
      return this.durability >= threshold ? this.attack : this.attack / 2;
    }
  
    isBroken() {
      return this.durability <= 0;
    }
  }
  
  // Базовые варианты оружия
  class Arm extends Weapon {
    constructor() {
      super("Рука", 1, Infinity, 1);
    }
  }
  
  class Bow extends Weapon {
    constructor() {
      super("Лук", 10, 200, 3);
    }
  }
  
  class Sword extends Weapon {
    constructor() {
      super("Меч", 25, 500, 1);
    }
  }
  
  class Knife extends Weapon {
    constructor() {
      super("Нож", 5, 300, 1);
    }
  }
  
  class Staff extends Weapon {
    constructor() {
      super("Посох", 8, 300, 2);
    }
  }
  
  // Улучшенное оружие
  class LongBow extends Bow {
    constructor() {
      super();
      this.name = "Длинный лук";
      this.attack = 15;
      this.range = 4;
      // durability наследуем от Bow (200)
      // initDurability = 200
    }
  }
  
  class Axe extends Sword {
    constructor() {
      super();
      this.name = "Секира";
      this.attack = 27;
      this.durability = 800;
      this.initDurability = 800;
      // range наследуем от Sword (1)
    }
  }
  
  class StormStaff extends Staff {
    constructor() {
      super();
      this.name = "Посох Бури";
      this.attack = 10;
      this.range = 3;
      // durability наследуем от Staff (300)
    }
  }
  
  /////////////////////////////////////////////////
  //   БАЗОВЫЙ КЛАСС ИГРОКА (Player)
  /////////////////////////////////////////////////
  
  class Player {
    constructor(position, name) {
      this.life = 100;
      this.magic = 20;
      this.speed = 1;
      this.attack = 10;
      this.agility = 5;
      this.luck = 10;
      this.description = "Игрок";
      this.weapon = new Arm();
      this.position = position;
      this.name = name;
      // Счётчик полученных ударов (нужен, например, для Гнома)
      this._hitsReceived = 0;
    }
  
    getLuck() {
      const randomNumber = Math.random() * 100; 
      return (randomNumber + this.luck) / 100;
    }
  
    getDamage(distance) {
      if (distance > this.weapon.range) {
        return 0;
      }
      const weaponDamage = this.weapon.getDamage();
      if (weaponDamage <= 0) {
        return 0;
      }
      const totalDamage = (this.attack + weaponDamage) * this.getLuck() / distance;
      return totalDamage;
    }
  
    takeDamage(damage) {
      this.life -= damage;
      if (this.life < 0) {
        this.life = 0;
      }
    }
  
    isDead() {
      return this.life <= 0;
    }
  
    moveLeft(distance) {
      const realDist = distance > this.speed ? this.speed : distance;
      this.position -= (realDist > 0 ? realDist : this.speed);
    }
  
    moveRight(distance) {
      const realDist = distance > this.speed ? this.speed : distance;
      this.position += (realDist > 0 ? realDist : this.speed);
    }
  
    move(distance) {
      if (distance < 0) {
        this.moveLeft(Math.abs(distance));
      } else {
        this.moveRight(distance);
      }
    }
  
    // true, если getLuck() > (100 - luck) / 100
    isAttackBlocked() {
      const threshold = (100 - this.luck) / 100;
      return this.getLuck() > threshold;
    }
  
    // true, если getLuck() > (100 - agility - speed * 3) / 100
    dodged() {
      const threshold = (100 - this.agility - this.speed * 3) / 100;
      return this.getLuck() > threshold;
    }
  
    // takeAttack(damage): порядок:
    // 1) если атака заблокирована — урон в weapon
    // 2) если уворот — урон не засчитывается
    // 3) иначе — урон по life
    takeAttack(damage) {
      this._hitsReceived++;
      if (this.isAttackBlocked()) {
        this.weapon.takeDamage(damage);
        return;
      }
      if (this.dodged()) {
        return;
      }
      this.takeDamage(damage);
    }
  
    // Если оружие сломалось — переходим к следующему (Knife -> Arm и т.д.)
    checkWeapon() {
      if (!this.weapon.isBroken()) {
        return;
      }
      const name = this.weapon.name;
      const fallback = {
        "Меч": () => new Knife(),
        "Секира": () => new Knife(),
        "Лук": () => new Knife(),
        "Длинный лук": () => new Knife(),
        "Посох": () => new Knife(),
        "Посох Бури": () => new Knife(),
        "Нож": () => new Arm(),
      };
      if (fallback[name]) {
        this.weapon = fallback[name]();
      } else {
        this.weapon = new Arm();
      }
    }
  
    // tryAttack(enemy):
    // 1) distance = |this.position - enemy.position|
    // 2) если distance > this.weapon.range, атака не проходит
    // 3) иначе изнашиваем оружие (takeDamage(10 * getLuck()))
    // 4) enemy.takeAttack(getDamage(distance))
    // 5) если position совпадают — удвоенный урон и враг отлетает
    tryAttack(enemy) {
      const distance = Math.abs(this.position - enemy.position);
      if (distance > this.weapon.range) {
        return;
      }
      const wear = 10 * this.getLuck();
      this.weapon.takeDamage(wear);
  
      let damage = this.getDamage(distance);
  
      if (this.position === enemy.position) {
        enemy.position += 1; 
        damage *= 2; 
        enemy.takeAttack(damage);
      } else {
        enemy.takeAttack(damage);
      }
      this.checkWeapon();
    }
  
    chooseEnemy(players) {
      const alive = players.filter(p => !p.isDead());
      if (alive.length <= 1) {
        return null;
      }
      let minLife = Infinity;
      let chosen = null;
      for (const pl of alive) {
        if (pl !== this && pl.life < minLife) {
          minLife = pl.life;
          chosen = pl;
        }
      }
      return chosen;
    }
  
    moveToEnemy(enemy) {
      if (!enemy) return;
      const distance = enemy.position - this.position;
      if (distance > 0) {
        this.moveRight(distance);
      } else if (distance < 0) {
        this.moveLeft(Math.abs(distance));
      }
    }
  
    turn(players) {
      if (this.isDead()) return;
      const enemy = this.chooseEnemy(players);
      if (!enemy) return;
      this.moveToEnemy(enemy);
      this.tryAttack(enemy);
    }
  }
  
  /////////////////////////////////////////////////
  //   КЛАССЫ-НАСЛЕДНИКИ Player
  /////////////////////////////////////////////////
  
  class Warrior extends Player {
    constructor(position, name) {
      super(position, name);
      this.life = 120;
      // magic = 20 (из Player)
      this.speed = 2;
      this.attack = 10;
      this.description = "Воин";
      this.weapon = new Sword();
    }
  
    // если здоровье < 50% (т.е. <60) и getLuck()>0.8, урон уходит в magic
    takeDamage(damage) {
      if (this.life < 60 && this.getLuck() > 0.8 && this.magic > 0) {
        const magicAfter = this.magic - damage;
        if (magicAfter < 0) {
          const leftover = Math.abs(magicAfter);
          this.magic = 0;
          super.takeDamage(leftover);
        } else {
          this.magic = magicAfter;
        }
      } else {
        super.takeDamage(damage);
      }
    }
  }
  
  class Archer extends Player {
    constructor(position, name) {
      super(position, name);
      this.life = 80;
      this.magic = 35;
      // speed = 1 (из Player)
      this.attack = 5;
      this.agility = 10;
      this.description = "Лучник";
      this.weapon = new Bow();
    }
  
    // (attack + weaponDamage) * getLuck() * distance / weaponRange
    getDamage(distance) {
      if (distance > this.weapon.range) {
        return 0;
      }
      const weaponDamage = this.weapon.getDamage();
      if (weaponDamage <= 0) {
        return 0;
      }
      return (this.attack + weaponDamage) * this.getLuck() * distance / this.weapon.range;
    }
  }
  
  class Mage extends Player {
    constructor(position, name) {
      super(position, name);
      this.life = 70;
      this.magic = 100;
      this.attack = 5;
      this.agility = 8;
      this.description = "Маг";
      this.weapon = new Staff();
    }
  
    // при magic>50 урон в 2 раза меньше и magic -=12
    takeDamage(damage) {
      if (this.magic > 50) {
        super.takeDamage(damage / 2);
        this.magic -= 12;
      } else {
        super.takeDamage(damage);
      }
    }
  }
  
  /////////////////////////////////////////////////
  //   УЛУЧШЕННЫЕ КЛАССЫ
  /////////////////////////////////////////////////
  
  class Dwarf extends Warrior {
    constructor(position, name) {
      super(position, name);
      this.life = 130;
      this.attack = 15;
      this.luck = 20;
      this.description = "Гном";
      this.weapon = new Axe();
      this._hitsReceived = 0;
    }
  
    // каждый шестой удар соперника наносит в 2 раза меньше урона при getLuck() > 0.5
    takeDamage(damage) {
      this._hitsReceived++;
      if (this._hitsReceived % 6 === 0 && this.getLuck() > 0.5) {
        damage = damage / 2;
      }
      super.takeDamage(damage);
    }
  }
  
  class Crossbowman extends Archer {
    constructor(position, name) {
      super(position, name);
      this.life = 85;
      this.attack = 8;
      this.agility = 20;
      this.luck = 15;
      this.description = "Арбалетчик";
      this.weapon = new LongBow();
    }
  }
  
  class Demiurge extends Mage {
    constructor(position, name) {
      super(position, name);
      this.life = 80;
      this.magic = 120;
      this.attack = 6;
      this.luck = 12;
      this.description = "Демиург";
      this.weapon = new StormStaff();
    }
  
    // при magic>0 и getLuck()>0.6 => урон *1.5
    getDamage(distance) {
      if (distance > this.weapon.range) {
        return 0;
      }
      const weaponDamage = this.weapon.getDamage();
      if (weaponDamage <= 0) {
        return 0;
      }
      let dmg = (this.attack + weaponDamage) * this.getLuck() / distance;
      if (this.magic > 0 && this.getLuck() > 0.6) {
        dmg *= 1.5;
      }
      return dmg;
    }
  }
  
  /////////////////////////////////////////////////
  //   ФУНКЦИЯ play(players)
  /////////////////////////////////////////////////
  
  function play(players) {
    let round = 1;
    while (players.filter(p => !p.isDead()).length > 1) {
      console.log(`\n----- Раунд ${round} -----`);
      for (let p of players) {
        if (!p.isDead()) {
          p.turn(players);
        }
      }
      round++;
    }
    const alive = players.filter(p => !p.isDead());
    if (alive.length === 1) {
      console.log(`\nПобедитель: ${alive[0].description} "${alive[0].name}" (life=${alive[0].life})`);
      return alive[0];
    } else if (alive.length === 0) {
      console.log("\nВсе погибли. Никто не выжил!");
      return null;
    }
  }
  
  // Экспортируем все нужные классы и функции, 
  // чтобы их можно было вызвать в другом файле:
  module.exports = {
    Weapon, Arm, Bow, Sword, Knife, Staff,
    LongBow, Axe, StormStaff,
    Player, Warrior, Archer, Mage, Dwarf, Crossbowman, Demiurge,
    play
  };
  