import Phaser from "phaser";

export default class Vortex {
  private scene: Phaser.Scene & { matterCollision: any };
  constructor(
    scene: Phaser.Scene & { matterCollision: any },
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) {
    this.scene = scene;
    const vortex = this.scene.matter.add.sprite(x, y, "atlas", "Rift.png", {
      isStatic: true,
      isSensor: true,
      ignoreGravity: true,
    });
    vortex.setDisplaySize(width, height);
    vortex.setRotation(Phaser.Math.DegToRad(rotation));

    const particles = this.scene.add.particles("atlas");
    const circle = new Phaser.Geom.Circle(0, 0, width / 2);
    const emitter = particles.createEmitter({
      frame: "VortexParticle.png",
      lifespan: 500,
      scale: { start: 1.0, end: 0 },
      emitZone: { type: "random", source: circle, quantity: 50 },
    });

    emitter.setPosition(vortex.x, vortex.y);
    emitter.setSpeed(50);
  }
}
