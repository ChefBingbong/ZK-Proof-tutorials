import { secp256k1 } from "@noble/curves/secp256k1";

import type {
      AffinePoint,
      AffinePointJSON,
      ProjectivePoint,
} from "./lib/types/common.types.js";

export const N = secp256k1.CURVE.n;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface JSONable {
      toJSON(): Json;

      // Don't want to work this around for now.
      // https://github.com/microsoft/TypeScript/issues/33892
      // fromJSON(json: Json): this;
}

export type ZkSchRandomness = {
      a: bigint;
      commitment: ZkSchCommitment;
};

export type ZkSchResponseJSON = {
      Zhex: string;
};

// Identity point? TODO: check if this is the right way to do it
const isIdentity = (point: ProjectivePoint) => {
      return (point.px === 0n && point.py === 0n) || point.pz === 0n;
};

const pointToJSON = (point: AffinePoint): AffinePointJSON => {
      return {
            xHex: point.x.toString(16),
            yHex: point.y.toString(16),
      };
};

const pointFromJSON = (point: AffinePointJSON): AffinePoint => {
      return {
            x: BigInt(`0x${point.xHex}`),
            y: BigInt(`0x${point.yHex}`),
      };
};

export class ZkSchResponse implements JSONable {
      public readonly Z: bigint;

      private constructor(Z: bigint) {
            this.Z = Z;
      }

      public static from({ Z }: { Z: bigint }): ZkSchResponse {
            const c = new ZkSchResponse(Z);
            Object.freeze(c);
            return c;
      }

      public toJSON(): ZkSchResponseJSON {
            return {
                  Zhex: this.Z.toString(16),
            };
      }

      public static fromJSON(json: ZkSchResponseJSON): ZkSchResponse {
            return ZkSchResponse.from({
                  Z: BigInt(`0x${json.Zhex}`),
            });
      }
}

export type ZkSchCommitmentJSON = {
      C: AffinePointJSON;
};

export class ZkSchCommitment implements JSONable {
      public readonly C: AffinePoint;

      private constructor(C: AffinePoint) {
            this.C = C;
      }

      public static from({ C }: { C: AffinePoint }): ZkSchCommitment {
            const c = new ZkSchCommitment(C);
            Object.freeze(c);
            return c;
      }

      public toJSON(): ZkSchCommitmentJSON {
            return {
                  C: pointToJSON(this.C),
            };
      }

      public static fromJSON(json: ZkSchCommitmentJSON): ZkSchCommitment {
            return ZkSchCommitment.from({
                  C: pointFromJSON(json.C),
            });
      }
}
