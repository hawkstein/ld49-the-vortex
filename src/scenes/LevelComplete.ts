import Phaser from "phaser";
import Scenes from "@scenes";
import { getCurrentLevel, setCurrentLevel } from "data";

export default class LevelComplete extends Phaser.Scene {
  constructor() {
    super(Scenes.LEVEL_COMPLETE);
  }

  create() {
    const title = this.add.image(
      this.cameras.main.centerX,
      100,
      "title_graphic"
    );

    const { ENTER } = Phaser.Input.Keyboard.KeyCodes;

    const enterKey = this.input.keyboard.addKey(ENTER);
    enterKey.on("down", () => {
      this.scene.start(Scenes.GAME);
    });

    this.add.text(
      title.getBottomLeft().x + 20,
      title.getBottomLeft().y + 20,
      `Press Enter to start Level ${getCurrentLevel()}`,
      {
        color: "#fff",
        backgroundColor: "#000",
        padding: { x: 4, y: 4 },
      }
    );

    this.add.text(
      title.getBottomLeft().x + 20,
      title.getBottomLeft().y + 50,
      `Controls: WASD or Arrows. P for Pause/Options.`,
      {
        color: "#fff",
      }
    );

    for (let index = 1; index < 7; index++) {
      const level = this.add.text(
        title.getBottomLeft().x + 20,
        title.getBottomLeft().y + 70 + index * 34,
        `Load Level ${index}`,
        {
          color: "#fff",
        }
      );
      level.setInteractive();
      level.on("pointerdown", () => {
        setCurrentLevel(index);
        this.scene.start(Scenes.GAME);
      });
    }
  }
}
