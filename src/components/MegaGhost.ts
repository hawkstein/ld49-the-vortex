import Phaser from "phaser";
import { playSound } from "@utils/Sounds";

export default class MegaGhost {
  private scene: Phaser.Scene & {
    matterCollision: any;
    player: any;
    ghostDeathSounds: Phaser.Sound.BaseSound[];
  };
  public sprite: Phaser.GameObjects.Sprite;
  public sensor: MatterJS.BodyType;
  private destroyTimer: Phaser.Time.TimerEvent;

  private acc: { x: number; y: number } = { x: 0, y: 0 };
  private lastUpdate: number = 0;

  constructor(
    scene: Phaser.Scene & {
      matterCollision: any;
      player: any;
      ghostDeathSounds: Phaser.Sound.BaseSound[];
    },
    x: number,
    y: number
  ) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "atlas", "Ghost.png");
    const { width: w, height: h } = this.sprite;
    this.sensor = this.scene.matter.add.rectangle(0, 0, w, h, {
      chamfer: { radius: 10 },
      isSensor: true,
      ignoreGravity: true,
    });

    this.scene.events.on("update", this.update, this);
    this.destroyTimer = this.scene.time.addEvent({
      delay: Phaser.Math.RND.between(2000, 5000),
      callback: () => {
        this.destroy();
      },
    });

    const unsubscribeGhostCollide =
      this.scene.matterCollision.addOnCollideStart({
        objectA: this.scene.player.sprite,
        objectB: this.sensor,
        callback: () => {
          unsubscribeGhostCollide();
          this.scene.player.disableInput();
          playSound(Phaser.Math.RND.pick(this.scene.ghostDeathSounds));
          const cam = this.scene.cameras.main;
          cam.fade(250, 0, 0, 0);
          cam.once("camerafadeoutcomplete", () => this.scene.scene.restart());
        },
      });
  }

  update(time: number) {
    if (time > this.lastUpdate + 500) {
      const { x, y } = this.scene.player.sprite;
      const difference = new Phaser.Math.Vector2(
        x - this.sprite.x,
        y - this.sprite.y
      ).normalize();
      this.scene.tweens.add({
        targets: this.acc,
        x: 5 * difference.x,
        y: 5 * difference.y,
      });

      this.lastUpdate = time;
    }
    this.sprite.x += this.acc.x;
    this.sprite.y += this.acc.y;
    const { width: w, height: h } = this.sprite;
    this.sensor.position = {
      x: this.sprite.x + w / 2,
      y: this.sprite.y,
    };
    this.sprite.setFlipX(this.acc.x > 0);
  }

  destroy() {
    this.scene.matter.world.remove(this.sensor);
    this.scene.events.off("update", this.update, this);
    this.sprite.destroy();
    this.destroyTimer.destroy();
  }
}
