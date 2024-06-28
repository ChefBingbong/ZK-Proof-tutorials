import { secp256k1 } from "@noble/curves/secp256k1";

import type { Hasher } from "./lib/Hasher";
import type {
      AffinePoint,
      AffinePointJSON,
      ProjectivePoint,
} from "./lib/types/common.types.js";
import { sampleScalar } from "./lib/sample.js";
import { modAdd, modMultiply } from "bigint-crypto-utils";

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

export type ZkSchProof = {
      C: ZkSchCommitment;
      Z: ZkSchResponse;
};

export const zkSchCreateProof = (
      hasher: Hasher,
      pubPoint: AffinePoint,
      priv: bigint,
      gen: AffinePoint
): ZkSchProof | null => {
      const a = zkSchCreateRandomness(gen);
      const Z = zkSchProve(a, hasher, pubPoint, priv, gen);

      if (!Z) {
            return null;
      }

      return {
            C: a.commitment,
            Z,
      };
};

export const zkSchCreateRandomness = (genIn?: AffinePoint): ZkSchRandomness => {
      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;
      const a = sampleScalar();
      const commitment = ZkSchCommitment.from({
            C: gen.multiply(a).toAffine(),
      });
      return { a, commitment };
};

const challenge = (
      hasher: Hasher,
      commitment: ZkSchCommitment,
      pubPoint: AffinePoint,
      gen: AffinePoint
): bigint => {
      const bigHash = hasher
            .updateMulti([commitment.C, pubPoint, gen])
            .digestBigint();

      const challenge = modAdd([bigHash, N - 2n ** 255n], N); // TODO

      return challenge;
};

export const zkSchProve = (
      r: ZkSchRandomness,
      hasher: Hasher,
      pubPoint: AffinePoint,
      secret: bigint,
      genIn?: AffinePoint
): ZkSchResponse | null => {
      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;

      if (
            isIdentity(secp256k1.ProjectivePoint.fromAffine(pubPoint)) ||
            secret === 0n
      ) {
            return null;
      }

      const e = challenge(hasher, r.commitment, pubPoint, gen);
      const es = modMultiply([e, secret], N);
      const Z = modAdd([es, r.a], N);

      return ZkSchResponse.from({ Z });
};

export const zkSchVerifyResponse = (
      z: ZkSchResponse | null,
      hasher: Hasher,
      pubPoint: AffinePoint,
      commitment: ZkSchCommitment,
      genIn?: AffinePoint
): boolean => {
      if (!z) {
            return false;
      }

      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;

      const pubPointProj = secp256k1.ProjectivePoint.fromAffine(pubPoint);
      if (!z || !zkSchIsResponseValid(z) || isIdentity(pubPointProj)) {
            return false;
      }

      const e = challenge(hasher, commitment, pubPoint, gen);

      const lhs = gen.multiply(z.Z);
      const rhs = pubPointProj
            .multiply(e)
            .add(secp256k1.ProjectivePoint.fromAffine(commitment.C));

      return lhs.equals(rhs);
};

export const zkSchVerifyProof = (
      p: ZkSchProof,
      hasher: Hasher,
      pubPoint: AffinePoint,
      genIn: AffinePoint
): boolean => {
      if (!zkSchIsProofValid(p)) {
            return false;
      }
      return zkSchVerifyResponse(p.Z, hasher, pubPoint, p.C, genIn);
};

const zkSchIsCommitmentValid = (c: ZkSchCommitment): boolean => {
      if (!c || isIdentity(secp256k1.ProjectivePoint.fromAffine(c.C))) {
            return false;
      }
      return true;
};

export const zkSchIsResponseValid = (z: ZkSchResponse): boolean => {
      if (!z || z.Z === 0n) {
            return false;
      }
      return true;
};

const zkSchIsProofValid = (p: ZkSchProof): boolean => {
      if (!p || !zkSchIsResponseValid(p.Z) || !zkSchIsCommitmentValid(p.C)) {
            return false;
      }
      return true;
};
