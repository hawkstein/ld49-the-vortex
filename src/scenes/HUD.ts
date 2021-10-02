import Phaser from "phaser";

export default class HUD extends Phaser.Scene {
  constructor() {
    super("HUD");
    console.log("HUD!");
  }

  init() {}

  preload() {}

  create() {
    this.input.keyboard.on("keydown-P", () => {
      console.log("P");
      if (this.scene.isPaused("GameScene")) {
        this.scene.resume("GameScene");
      } else {
        this.scene.pause("GameScene");
      }
    });
  }
}
