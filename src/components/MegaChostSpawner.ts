import Phaser from "phaser";
import MegaGhost from "./MegaGhost";

export default class MegaGhostSpawner {
  private scene: Phaser.Scene & { matterCollision: any; player: any };
  private spawnTimer: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene & { matterCollision: any; player: any },
    x: number,
    y: number
  ) {
    this.scene = scene;

    const spawnGhost = () => {
      console.log("Spawn MEGA GHOST!");
      const megaGhost = new MegaGhost(this.scene, x, y);
      this.spawnTimer = this.scene.time.addEvent({
        delay: Phaser.Math.RND.between(2000, 3000),
        callback: spawnGhost,
      });
    };

    this.spawnTimer = this.scene.time.addEvent({
      delay: 250,
      callback: spawnGhost,
    });
  }
}
