import Phaser from "phaser";
import Scenes from "@scenes";
import { getCurrentLevel, setCurrentLevel } from "data";
import Player from "../components/Player";

export default class Game extends Phaser.Scene {
  public matterCollision: any;
  private player!: Player;
  private isComplete: boolean = false;

  constructor() {
    super(Scenes.GAME);
  }

  init() {
    //this.scene.launch("HUD");
  }

  create() {
    const level = getCurrentLevel();
    const map = this.make.tilemap({ key: `level_0${level}` });
    const tileset = map.addTilesetImage("BasicTile");
    const layer = map.createLayer(0, tileset, 0, 0);

    layer.setCollisionFromCollisionGroup();

    this.matter.world.convertTilemapLayer(layer);
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    const playerSpawn = map.findObject("Spawn", (obj) => obj.name === "Player");

    this.player = new Player(this, playerSpawn?.x ?? 0, playerSpawn?.y ?? 0);

    const exitSpawn = map.findObject("Spawn", (obj) => obj.name === "Exit");
    console.log(exitSpawn);

    if (exitSpawn) {
      const exit = this.matter.add.sprite(
        exitSpawn.x ?? 0,
        exitSpawn.y ?? 0,
        "atlas",
        "Exit.png"
      );
      const unsubscribe = this.matterCollision.addOnCollideStart({
        objectA: [this.player.sprite],
        objectB: exit,
        callback: () => {
          this.player.disableInput();
          this.isComplete = true;
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

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);

    this.isComplete = false;
  }

  update(time: number, delta: number) {}
}
