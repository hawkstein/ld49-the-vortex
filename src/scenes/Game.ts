import Phaser from "phaser";
import Scenes from "@scenes";
import { getCurrentLevel, setCurrentLevel } from "data";
import Player from "../components/Player";

export default class Game extends Phaser.Scene {
  public matterCollision: any;
  private player!: Player;

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

    this.player = new Player(this, 20, 20);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);
  }

  update(time: number, delta: number) {
    if (this.player.sprite.y > 900) {
      setCurrentLevel(2);
      this.scene.start(Scenes.LEVEL_COMPLETE);
    }
  }
}
