import Phaser from "phaser";
import MultiKey from "@utils/MultiKey";

type Sensors = {
  bottom: MatterJS.BodyType;
  left: MatterJS.BodyType;
  right: MatterJS.BodyType;
};

type Touching = {
  ground: boolean;
  left: boolean;
  right: boolean;
};

export default class Player {
  private scene: Phaser.Scene & { matterCollision: any };
  public sprite: Phaser.Physics.Matter.Sprite;
  private sensors: Sensors;
  private touching: Touching;
  private canJump: boolean;
  private jumpTimer: Phaser.Time.TimerEvent | null;
  private leftInput: MultiKey;
  private rightInput: MultiKey;
  private jumpInput: MultiKey;
  private destroyed: boolean = false;
  private enabled: boolean = true;

  constructor(
    scene: Phaser.Scene & { matterCollision: any },
    x: number,
    y: number
  ) {
    this.scene = scene;

    // Create the animations we need from the player spritesheet
    const anims = scene.anims;
    anims.create({
      key: "idle",
      frames: anims.generateFrameNames("atlas", {
        prefix: "Player",
        suffix: ".png",
        start: 1,
        end: 1,
      }),
      frameRate: 6,
      repeat: -1,
    });
    anims.create({
      key: "run",
      frames: anims.generateFrameNames("atlas", {
        prefix: "Player",
        suffix: ".png",
        start: 2,
        end: 3,
      }),
      frameRate: 6,
      repeat: -1,
    });
    anims.create({
      key: "jump",
      frames: anims.generateFrameNames("atlas", {
        prefix: "Player",
        suffix: ".png",
        start: 4,
        end: 4,
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.sprite = scene.matter.add.sprite(0, 0, "atlas", "Player1.png");

    const { body, bodies } = this.scene.matter;
    const { width: w, height: h } = this.sprite;
    const mainBody = bodies.rectangle(0, 0, w * 0.6, h, {
      chamfer: { radius: 10 },
    });

    this.sensors = {
      bottom: bodies.rectangle(0, h * 0.5, w * 0.25, 2, { isSensor: true }),
      left: bodies.rectangle(-w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
      right: bodies.rectangle(w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
    };
    const compoundBody = body.create({
      parts: [
        mainBody,
        this.sensors.bottom,
        this.sensors.left,
        this.sensors.right,
      ],
      frictionStatic: 0,
      frictionAir: 0.04,
      friction: 0.2,
      render: { sprite: { xOffset: 0.5, yOffset: 0.5 } },
    });
    this.sprite.setExistingBody(compoundBody);
    this.sprite.setFixedRotation();
    this.sprite.setPosition(x, y);

    this.touching = { left: false, right: false, ground: false };

    this.canJump = true;
    this.jumpTimer = null;

    scene.matter.world.on("beforeupdate", this.resetTouching, this);

    scene.matterCollision.addOnCollideStart({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this,
    });
    scene.matterCollision.addOnCollideActive({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this,
    });

    const { LEFT, RIGHT, UP, A, D, W } = Phaser.Input.Keyboard.KeyCodes;
    this.leftInput = new MultiKey(scene, [LEFT, A]);
    this.rightInput = new MultiKey(scene, [RIGHT, D]);
    this.jumpInput = new MultiKey(scene, [UP, W]);

    this.scene.events.on("update", this.update, this);
    this.scene.events.once("shutdown", this.destroy, this);
    this.scene.events.once("destroy", this.destroy, this);
  }

  onSensorCollide({
    bodyA,
    bodyB,
    pair,
  }: {
    bodyA: any;
    bodyB: any;
    pair: any;
  }) {
    if (bodyB.isSensor) return;
    if (bodyA === this.sensors.left) {
      this.touching.left = true;
      if (pair.separation > 0.5) this.sprite.x += pair.separation - 0.5;
    } else if (bodyA === this.sensors.right) {
      this.touching.right = true;
      if (pair.separation > 0.5) this.sprite.x -= pair.separation - 0.5;
    } else if (bodyA === this.sensors.bottom) {
      this.touching.ground = true;
    }
  }

  resetTouching() {
    this.touching.left = false;
    this.touching.right = false;
    this.touching.ground = false;
  }

  freeze() {
    this.sprite.setStatic(true);
  }

  update() {
    if (this.destroyed || !this.enabled) return;

    const sprite = this.sprite;
    const velocity = sprite.body.velocity;
    const isRightKeyDown = this.rightInput.isDown();
    const isLeftKeyDown = this.leftInput.isDown();
    const isJumpKeyDown = this.jumpInput.isDown();
    const isOnGround = this.touching.ground;
    const isInAir = !isOnGround;

    // Horizontal Movement

    // Adjust the movement so that the player is slower in the air
    const moveForce = isOnGround ? 0.005 : 0.0025;

    if (isLeftKeyDown) {
      sprite.setFlipX(true);
      if (!(isInAir && this.touching.left)) {
        sprite.applyForce(new Phaser.Math.Vector2(-moveForce, 0));
      }
    } else if (isRightKeyDown) {
      sprite.setFlipX(false);
      if (!(isInAir && this.touching.right)) {
        sprite.applyForce(new Phaser.Math.Vector2(moveForce, 0));
      }
    }

    // Limit horizontal speed
    if (velocity.x > 3.5) sprite.setVelocityX(3.5);
    else if (velocity.x < -3.5) sprite.setVelocityX(-3.5);

    // Vertical movement
    if (isJumpKeyDown && this.canJump) {
      if (isOnGround) {
        //Jump up
        sprite.setVelocityY(-11);
      } else if (this.touching.left) {
        // Jump right from the wall
        sprite.setVelocityY(-11);
        sprite.setVelocityX(3.5);
      } else if (this.touching.right) {
        // Jump left from the wall
        sprite.setVelocityY(-11);
        sprite.setVelocityX(-3.5);
      }

      this.canJump = false;
      this.jumpTimer = this.scene.time.addEvent({
        delay: 250,
        callback: () => (this.canJump = true),
      });
    }

    // Update the animation/texture based on the state of the player's state
    if (isOnGround) {
      //@ts-ignore
      if (sprite.body.force.x !== 0) sprite.anims.play("run", true);
      else sprite.anims.play("idle", true);
    } else {
      sprite.anims.play("jump", true);
    }
  }

  disableInput() {
    this.enabled = false;
  }

  destroy() {
    this.destroyed = true;

    this.scene.events.off("update", this.update, this);
    this.scene.events.off("shutdown", this.destroy, this);
    this.scene.events.off("destroy", this.destroy, this);
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }

    const sensors = [
      this.sensors.bottom,
      this.sensors.left,
      this.sensors.right,
    ];
    this.scene.matterCollision.removeOnCollideStart({ objectA: sensors });
    this.scene.matterCollision.removeOnCollideActive({ objectA: sensors });

    this.jumpTimer?.destroy();
    this.sprite.destroy();
  }
}
