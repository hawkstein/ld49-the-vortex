import Phaser from "phaser";
import Scenes from "@scenes";

export default class Game extends Phaser.Scene {
  private player: any;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super(Scenes.GAME);
  }

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.scene.launch("HUD");
  }

  create() {
    const map = this.make.tilemap({ key: "level_01" });
    const tileset = map.addTilesetImage("BasicTile");
    const layer = map.createLayer(0, tileset, 0, 0);

    layer.setCollisionFromCollisionGroup();

    this.matter.world.convertTilemapLayer(layer);
    this.matter.world.setBounds(
      0,
      -100,
      map.widthInPixels,
      map.heightInPixels + 100
    );
    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;

    this.player = {
      matterSprite: this.matter.add.sprite(0, 0, "atlas", "Player.png"),
      blocked: {
        left: false,
        right: false,
        bottom: false,
      },
      numTouching: {
        left: 0,
        right: 0,
        bottom: 0,
      },
      sensors: {
        bottom: null,
        left: null,
        right: null,
      },
      lastJumpedAt: 0,
      speed: {
        run: 3,
        jump: 7,
      },
    };

    const M = this.matter;
    const w = this.player.matterSprite.width;
    const h = this.player.matterSprite.height;

    // Move the sensor to player center
    var sx = w / 2;
    var sy = h / 2;

    var playerBody = M.bodies.rectangle(sx, sy, w * 0.75, h, {
      chamfer: { radius: 5 },
    });
    this.player.sensors.bottom = M.bodies.rectangle(sx, h, sx, 5, {
      isSensor: true,
    });
    this.player.sensors.left = M.bodies.rectangle(
      sx - w * 0.45,
      sy,
      5,
      h * 0.25,
      { isSensor: true }
    );
    this.player.sensors.right = M.bodies.rectangle(
      sx + w * 0.45,
      sy,
      5,
      h * 0.25,
      { isSensor: true }
    );
    var compoundBody = M.body.create({
      parts: [
        playerBody,
        this.player.sensors.bottom,
        this.player.sensors.left,
        this.player.sensors.right,
      ],
      friction: 0.03,
      restitution: 0.1, // Prevent body from sticking against a wall
    });

    this.player.matterSprite
      .setExistingBody(compoundBody)
      .setFixedRotation() // Sets max inertia to prevent rotation
      .setPosition(20, 0);

    this.matter.world.on("beforeupdate", () => {
      this.player.numTouching.left = 0;
      this.player.numTouching.right = 0;
      this.player.numTouching.bottom = 0;
    });

    // Loop over the active colliding pairs and count the surfaces the player is touching.
    this.matter.world.on("collisionactive", (event: { pairs: any[] }) => {
      var playerBody = this.player.body;
      var left = this.player.sensors.left;
      var right = this.player.sensors.right;
      var bottom = this.player.sensors.bottom;

      for (var i = 0; i < event.pairs.length; i++) {
        var bodyA = event.pairs[i].bodyA;
        var bodyB = event.pairs[i].bodyB;

        if (bodyA === playerBody || bodyB === playerBody) {
          continue;
        } else if (bodyA === bottom || bodyB === bottom) {
          // Standing on any surface counts (e.g. jumping off of a non-static crate).
          this.player.numTouching.bottom += 1;
        } else if (
          (bodyA === left && bodyB.isStatic) ||
          (bodyB === left && bodyA.isStatic)
        ) {
          // Only static objects count since we don't want to be blocked by an object that we
          // can push around.
          this.player.numTouching.left += 1;
        } else if (
          (bodyA === right && bodyB.isStatic) ||
          (bodyB === right && bodyA.isStatic)
        ) {
          this.player.numTouching.right += 1;
        }
      }
    });

    // Update over, so now we can determine if any direction is blocked
    this.matter.world.on("afterupdate", () => {
      this.player.blocked.right = this.player.numTouching.right > 0;
      this.player.blocked.left = this.player.numTouching.left > 0;
      this.player.blocked.bottom = this.player.numTouching.bottom > 0;
    });

    this.cameras.main.startFollow(this.player.matterSprite, false, 0.5, 0.5);
  }

  update(time: number, delta: number) {
    const matterSprite = this.player.matterSprite;

    // Horizontal movement
    if (this.cursors?.left.isDown && !this.player.blocked.left) {
      matterSprite.setFlipX(true);

      if (!this.player.blocked.bottom && this.player.lastJumpedAt < 100) {
        matterSprite.setVelocityX(-this.player.speed.run / 2);
      } else {
        matterSprite.setVelocityX(-this.player.speed.run);
      }
    } else if (this.cursors?.right.isDown && !this.player.blocked.right) {
      if (!this.player.blocked.bottom && this.player.lastJumpedAt < 100) {
        matterSprite.setVelocityX(this.player.speed.run / 2);
      } else {
        matterSprite.setVelocityX(this.player.speed.run);
      }
    } else {
      //matterSprite.anims.play("idle", true);
    }

    // Jumping & wall jumping
    // Add a slight delay between jumps since the sensors will still collide for a few frames after
    // a jump is initiated
    var canJump = time - this.player.lastJumpedAt > 250;
    if (this.cursors?.up.isDown && canJump) {
      if (this.player.blocked.bottom) {
        matterSprite.setVelocityY(-this.player.speed.jump);
        this.player.lastJumpedAt = time;
      } else if (this.player.blocked.left) {
        // Jump up and away from the wall
        matterSprite.setVelocityY(-this.player.speed.jump);
        matterSprite.setVelocityX(this.player.speed.run / 2);
        this.player.lastJumpedAt = time;
      } else if (this.player.blocked.right) {
        // Jump up and away from the wall
        matterSprite.setVelocityY(-this.player.speed.jump);
        matterSprite.setVelocityX(-this.player.speed.run / 2);
        this.player.lastJumpedAt = time;
      }
    }

    if (this.player.matterSprite.y > 900) {
      this.scene.start(Scenes.LEVEL_COMPLETE);
    }
  }
}
