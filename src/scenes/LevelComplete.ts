import Phaser from "phaser";
import Scenes from "@scenes";

export default class LevelComplete extends Phaser.Scene {
  constructor() {
    super(Scenes.LEVEL_COMPLETE);
  }

  create() {
    this.add.text(20, 20, "Click to go to next level", { color: "#000" });
  }
}
