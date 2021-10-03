import Phaser from "phaser";
import Scenes from "@scenes";
import { getCurrentLevel, setCurrentLevel } from "data";
import Player from "@components/Player";
import Ghost from "@components/Ghost";
import Vortex from "@components/Vortex";

const MAX_LEVEL = 6;
const SPAWN = "Spawn";

const levelHelp = [
  "Arrows/WASD to move the player.",
  "Watch out for spikes!",
  "Avoid ghosts and rifts too!",
  "Head to the top.",
  "Switches close rifts",
  "Close all the switches!",
];

export default class Game extends Phaser.Scene {
  public matterCollision: any;
  public player!: Player;
  private ghosts: Ghost[] = [];
  private switches: boolean[] = [];
  private vortexes: Map<string, Vortex> = new Map();
  private isFinalLevel: boolean = false;
  private isGameComplete: boolean = false;

  constructor() {
    super(Scenes.GAME);
  }

  init() {
    this.scene.launch(Scenes.HUD);
  }

  create() {
    const level = Math.min(getCurrentLevel(), MAX_LEVEL);
    const map = this.make.tilemap({ key: `level_0${level}` });
    const tileset = map.addTilesetImage("tilemap");
    const layer = map.createLayer(0, tileset, 0, 0);

    layer.setCollisionFromCollisionGroup();

    this.matter.world.convertTilemapLayer(layer);
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    const playerSpawn = map.findObject(SPAWN, (obj) => obj.name === "Player");

    const exitSpawn = map.findObject(SPAWN, (obj) => obj.name === "Exit");
    let exit = null;
    if (exitSpawn) {
      const { x = 0, y = 0, width = 0, height = 0 } = exitSpawn;
      exit = this.matter.add.sprite(
        x + width / 2,
        y + height / 2,
        "atlas",
        "Exit.png",
        {
          isSensor: true,
          isStatic: true,
        }
      );
    }

    this.player = new Player(this, playerSpawn?.x ?? 0, playerSpawn?.y ?? 0);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);

    if (exitSpawn) {
      const unsubscribe = this.matterCollision.addOnCollideStart({
        objectA: [this.player.sprite],
        objectB: exit,
        callback: () => {
          this.player.disableInput();
          this.cameras.main.fadeOut(1000, 0, 0, 0);
          this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
              setCurrentLevel(getCurrentLevel() + 1);
              this.scene.start(Scenes.LEVEL_COMPLETE);
            }
          );
          unsubscribe();
        },
      });
    }

    const unsubscribePlayerCollide = this.matterCollision.addOnCollideStart({
      objectA: this.player.sprite,
      callback: ({ gameObjectB }: { gameObjectB: any }) => {
        if (!gameObjectB || !(gameObjectB instanceof Phaser.Tilemaps.Tile))
          return;

        const tile = gameObjectB;

        if (tile.properties.lethal) {
          unsubscribePlayerCollide();
          this.player.freeze();
          const cam = this.cameras.main;
          cam.fade(250, 0, 0, 0);
          cam.once("camerafadeoutcomplete", () => this.scene.restart());
          return;
        }
      },
    });

    map.getObjectLayer(SPAWN).objects.forEach((spawnObject) => {
      const {
        x = 0,
        y = 0,
        width = 100,
        height = 100,
        type,
        name,
        rotation = 0,
      } = spawnObject;
      if (type === "Ghost") {
        this.ghosts.push(new Ghost(this, x, y));
      } else if (type === "Vortex") {
        const vortex = new Vortex(this, x, y, width, height, rotation);
        this.vortexes.set(name, vortex);
      }
    });

    const switchSensors: {
      sensor: MatterJS.BodyType;
      id: number;
      properties: {
        vortex: number;
        switchX: number;
        switchY: number;
      };
    }[] = [];
    map.getObjectLayer("Switches")?.objects.forEach((switchObject) => {
      const { x = 0, y = 0, width = 100, properties } = switchObject;
      const switchSensor = this.matter.add.circle(x, y, width, {
        isSensor: true,
        isStatic: true,
      });
      switchSensors.push({
        sensor: switchSensor,
        id: switchSensor.id,
        properties: {
          switchX: properties[0].value,
          switchY: properties[1].value,
          vortex: properties[2].value,
        },
      });
      this.switches[properties[2].value] = false;
    });

    this.matterCollision.addOnCollideStart({
      objectA: this.player.sprite,
      objectB: switchSensors.map((s) => s.sensor),
      callback: ({ bodyB }: { bodyB: any }) => {
        const sensorSwitch = switchSensors.find((s) => s.id === bodyB.id);
        if (sensorSwitch) {
          const properties = sensorSwitch.properties;
          this.switches[properties.vortex] = true;
          map.putTileAt(5, properties.switchX, properties.switchY);
          const vortex = this.vortexes.get(`Vortex_0${properties.vortex}`);
          vortex?.explode();
        }
      },
    });

    const unsubscribeGhostCollide = this.matterCollision.addOnCollideStart({
      objectA: this.player.sprite,
      objectB: this.ghosts.map((ghost) => ghost.sensor),
      callback: () => {
        unsubscribeGhostCollide();
        this.player.disableInput();
        const cam = this.cameras.main;
        cam.fade(250, 0, 0, 0);
        cam.once("camerafadeoutcomplete", () => this.scene.restart());
      },
    });

    const helpMessage = levelHelp[level - 1];
    if (helpMessage) {
      const help = this.add.text(16, 16, helpMessage, {
        fontSize: "18px",
        padding: { x: 10, y: 5 },
        backgroundColor: "#ffffff",
        color: "#000000",
      });
      help.setScrollFactor(0).setDepth(1000);
    }

    const megaVortex = map.findObject(
      SPAWN,
      (obj) => obj.name === "MegaVortex"
    );
    if (megaVortex) {
      console.log("MEGA VORTEX!");
      // add MegaVortex
      // Which spawns MegaGhosts
      // add victory check
      this.isFinalLevel = true;
    }
  }

  update(time: number, delta: number) {
    if (this.isFinalLevel && !this.isGameComplete) {
      if (this.switches.every((s) => s)) {
        this.isGameComplete = true;
        const cam = this.cameras.main;
        this.player.disableInput();
        cam.fade(500, 255, 255, 255);
        cam.once("camerafadeoutcomplete", () => this.scene.start(Scenes.END));
      }
    }
  }
}
