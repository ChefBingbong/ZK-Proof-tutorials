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
      private used = false;

      constructor(hash?: ReturnType<typeof blake3.create>) {
            this.hash = hash ?? blake3.create({});
      }

      private checkUsed() {
            if (this.used) {
                  throw new Error("Hasher already used");
            }
      }

      public static create(): Hasher {
            return new Hasher();
      }

      public clone(): Hasher {
            return new Hasher(this.hash.clone());
      }

      public update(data: Ingestable): Hasher {
            this.checkUsed();
            let buf: Array<IngestableBasic> = [];
            if (
                  data instanceof Uint8Array ||
                  typeof data === "string" ||
                  typeof data === "bigint"
            ) {
                  buf.push(data);
            } else if (typeof (data as Hashable).hashable === "function") {
                  buf = buf.concat((data as Hashable).hashable());
            } else if (isPoint(data)) {
                  buf = buf.concat(
                        pointToHashable(
                              data as ProjectivePoint | AffinePoint
                        ).hashable()
                  );
            } else {
                  throw new Error(`Unsupported data type: ${data}`);
            }
            for (let i = 0; i < buf.length; i += 1) {
                  this.updateBasic(buf[i]);
            }
            return this;
      }

      private updateBasic(data: IngestableBasic): Hasher {
            this.checkUsed();
            let buf: Input;
            if (data instanceof Uint8Array) {
                  buf = data;
            } else if (typeof data === "string") {
                  buf = data;
            } else if (typeof data === "bigint") {
                  let hex = data.toString(16);
                  if (hex.length % 2 === 1) {
                        hex = `0${hex}`;
                  }
                  buf = hexToBytes(hex);
            } else {
                  throw new Error("Unsupported data type", data);
            }
            this.hash.update(buf);
            return this;
      }

      public updateMulti(data: Array<Ingestable>): Hasher {
            this.checkUsed();
            for (let i = 0; i < data.length; i += 1) {
                  this.update(data[i]);
            }
            return this;
      }

      public digestBigint(): bigint {
            this.checkUsed();
            this.used = true;
            return bytesToNumberBE(this.hash.digest());
      }
}
