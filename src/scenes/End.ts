import Phaser from "phaser";
import Scenes from "@scenes";

export default class GameEnd extends Phaser.Scene {
  constructor() {
    super(Scenes.END);
  }

  create() {
    this.add.text(20, 20, "Well done! You beat the game!", { color: "#000" });
  }
}
