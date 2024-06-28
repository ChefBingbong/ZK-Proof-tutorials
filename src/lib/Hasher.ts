import { blake3 } from "@noble/hashes/blake3";

export class Hasher {
      private hash: ReturnType<typeof blake3.create>;

      constructor(hash?: ReturnType<typeof blake3.create>) {
            this.hash = hash ?? blake3.create({});
      }

      public static create(): Hasher {
            return new Hasher();
      }

      public clone(): Hasher {
            return new Hasher(this.hash.clone());
      }
}
