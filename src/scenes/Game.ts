import Phaser from "phaser";
import Scenes from "@scenes";
import { getCurrentLevel, setCurrentLevel } from "data";
import Player from "@components/Player";
import Ghost from "@components/Ghost";
import Vortex from "@components/Vortex";

const MAX_LEVEL = 5;
const SPAWN = "Spawn";

export default class Game extends Phaser.Scene {
  public matterCollision: any;
  public player!: Player;
  private ghosts: Ghost[] = [];

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

    layer.forEachTile((tile) => {
      if (tile.properties.switch) {
        //@ts-ignore
        tile.physics.matterBody.body.isSensor = true;
      }
    });

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    const playerSpawn = map.findObject(SPAWN, (obj) => obj.name === "Player");

    const exitSpawn = map.findObject(SPAWN, (obj) => obj.name === "Exit");

    if (exitSpawn) {
      const { x = 0, y = 0, width = 0, height = 0 } = exitSpawn;
      const exit = this.matter.add.sprite(
        x + width / 2,
        y + height / 2,
        "atlas",
        "Exit.png",
        {
          isSensor: true,
          isStatic: true,
        }
      );

      this.player = new Player(this, playerSpawn?.x ?? 0, playerSpawn?.y ?? 0);

      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);

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

        if (tile.properties.switch) {
          console.log("Switch");
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
        rotation = 0,
      } = spawnObject;
      if (type === "Ghost") {
        this.ghosts.push(new Ghost(this, x, y));
      } else if (type === "Vortex") {
        const vortex = new Vortex(this, x, y, width, height, rotation);
      }
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
  }

  update(time: number, delta: number) {}
}
