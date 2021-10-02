import Phaser from "phaser";

type KeyType = string | number | Phaser.Input.Keyboard.Key;

export default class MultiKey {
  private keys: Phaser.Input.Keyboard.Key[];
  constructor(scene: Phaser.Scene, keys: KeyType[] | KeyType) {
    if (!Array.isArray(keys)) keys = [keys];
    this.keys = keys.map((key) => scene.input.keyboard.addKey(key));
  }

  isDown() {
    return this.keys.some((key) => key.isDown);
  }

  isUp() {
    return this.keys.every((key) => key.isUp);
  }
}
