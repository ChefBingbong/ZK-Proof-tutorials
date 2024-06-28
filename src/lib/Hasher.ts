import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import { blake3 } from "@noble/hashes/blake3";
import { type Input, hexToBytes } from "@noble/hashes/utils";
import type { AffinePoint, ProjectivePoint } from "./types/common.types.js";

export type IngestableBasic = Uint8Array | string | bigint;
export interface Hashable {
      hashable(): Array<IngestableBasic>;
}

type Ingestable = IngestableBasic | ProjectivePoint | AffinePoint | Hashable;

const isPoint = (data: Ingestable): boolean => {
      return (
            typeof (data as AffinePoint).x === "bigint" &&
            typeof (data as AffinePoint).y === "bigint"
      );
};

const pointToHashable = (data: AffinePoint | ProjectivePoint): Hashable => {
      const captured: IngestableBasic[] = [];
      if (typeof (data as ProjectivePoint).toRawBytes === "function") {
            captured.push((data as ProjectivePoint).toRawBytes());
      } else {
            captured.push((data as AffinePoint).x, (data as AffinePoint).y);
      }
      return {
            hashable: () => captured,
      };
};

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
