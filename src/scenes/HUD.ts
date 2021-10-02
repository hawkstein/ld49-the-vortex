import Phaser from "phaser";
import Scenes from "@scenes";

export default class HUD extends Phaser.Scene {
  constructor() {
    super(Scenes.HUD);
  }

  init() {}

  preload() {}

  create() {
    this.input.keyboard.on("keydown-P", () => {
      if (this.scene.isPaused(Scenes.GAME)) {
        this.scene.resume(Scenes.GAME);
      } else {
        this.scene.pause(Scenes.GAME);
      }
    });
  }
}
