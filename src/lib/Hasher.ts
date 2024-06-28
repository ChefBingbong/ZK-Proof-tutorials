import { blake3 } from "@noble/hashes/blake3";

export type IngestableBasic = Uint8Array | string | bigint;
export interface Hashable {
      hashable(): Array<IngestableBasic>;
}

export class Hasher {
      private hash: ReturnType<typeof blake3.create>;

      constructor(hash?: ReturnType<typeof blake3.create>) {
            this.hash = hash ?? blake3.create({});
      }

      public clone(): Hasher {
            return new Hasher(this.hash.clone());
      }
}
