import Phaser from "phaser";

export default class Vortex {
  private scene: Phaser.Scene & { matterCollision: any };
  private sprite: Phaser.Physics.Matter.Sprite;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
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
    this.sprite = vortex;

    const particles = this.scene.add.particles("atlas");
    const circle = new Phaser.Geom.Circle(0, 0, width / 2);
    this.emitter = particles.createEmitter({
      frame: "VortexParticle.png",
      lifespan: 500,
      scale: { start: 1.0, end: 0 },
      emitZone: { type: "random", source: circle, quantity: 50 },
    });

    this.emitter.setPosition(vortex.x, vortex.y);
    this.emitter.setSpeed(50);
  }

  explode() {
    this.sprite.destroy();
    this.emitter.stop();
  }
}
