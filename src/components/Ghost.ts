import Phaser from "phaser";

export default class Ghost {
  private scene: Phaser.Scene & { matterCollision: any; player: any };
  public sprite: Phaser.GameObjects.Sprite;
  public sensor: MatterJS.BodyType;

  private acc: { x: number; y: number } = { x: 0, y: 0 };
  private lastUpdate: number = 0;

  constructor(
    scene: Phaser.Scene & { matterCollision: any; player: any },
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

    this.scene.events.on("update", (time: number) => {
      if (time > this.lastUpdate + 1000) {
        const { x, y } = this.scene.player.sprite;
        if (
          Phaser.Math.Distance.Between(x, y, this.sprite.x, this.sprite.y) < 400
        ) {
          const difference = new Phaser.Math.Vector2(
            x - this.sprite.x,
            y - this.sprite.y
          ).normalize();
          this.scene.tweens.add({
            targets: this.acc,
            x: 2 * difference.x,
            y: 2 * difference.y,
          });
        } else {
          this.scene.tweens.add({ targets: this.acc, x: 0, y: 0 });
        }
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
    });
  }
}
