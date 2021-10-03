import Phaser from "phaser";
import Scenes from "@scenes";

export default class Preload extends Phaser.Scene {
  constructor() {
    super(Scenes.PRELOAD);
  }

  init() {}

  preload() {
    this.add.text(20, 20, "Loading...", { color: "#000" });
    this.load.pack({ key: "preload", url: "assets/pack.json" });
  }

  create() {
    this.scene.start(Scenes.LEVEL_COMPLETE);
  }
}
