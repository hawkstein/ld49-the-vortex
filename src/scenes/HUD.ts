import Phaser from "phaser";
import Scenes from "@scenes";
import { getOption, setOption } from "data";

export default class HUD extends Phaser.Scene {
  constructor() {
    super(Scenes.HUD);
  }

  create() {
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.5);
    background.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );
    background.visible = false;

    const title = this.add.text(
      this.cameras.main.centerX - 100,
      100,
      `Paused (P to resume)`,
      {
        color: "#fff",
        fontSize: "24px",
        padding: { x: 10, y: 5 },
        backgroundColor: "#000",
      }
    );
    title.visible = false;

    const quitInstructions = this.add.text(
      this.cameras.main.centerX - 150,
      180,
      `Press Q to quit to title/level select`,
      {
        color: "#fff",
        fontSize: "18px",
      }
    );
    quitInstructions.visible = false;

    const soundIntructions = this.add.text(
      this.cameras.main.centerX - 150,
      230,
      `Press S to toggle SFX`,
      {
        color: "#fff",
        fontSize: "18px",
      }
    );
    soundIntructions.visible = false;

    this.input.keyboard.on("keydown-P", () => {
      if (this.scene.isPaused(Scenes.GAME)) {
        this.scene.resume(Scenes.GAME);
        background.visible = false;
        title.visible = false;
        quitInstructions.visible = false;
        soundIntructions.visible = false;
      } else {
        this.scene.pause(Scenes.GAME);
        background.visible = true;
        title.visible = true;
        quitInstructions.visible = true;
        soundIntructions.visible = true;
      }
    });

    this.input.keyboard.on("keydown-Q", () => {
      if (this.scene.isPaused(Scenes.GAME)) {
        this.scene.stop(Scenes.GAME);
        this.scene.start(Scenes.LEVEL_COMPLETE);
      }
    });

    this.input.keyboard.on("keydown-S", () => {
      if (this.scene.isPaused(Scenes.GAME)) {
        const sfx = getOption("sfx");
        setOption("sfx", !sfx);
        console.log(getOption("sfx"));
      }
    });
  }
}
