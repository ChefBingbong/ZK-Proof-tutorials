import { secp256k1 } from "@noble/curves/secp256k1";
import { randBetween } from "bigint-crypto-utils";

import type {
      AffinePoint,
      AffinePointJSON,
      ProjectivePoint,
} from "./types/common.types.js";

export const N = secp256k1.CURVE.n;

export const sampleScalarPointPair = (): [bigint, AffinePoint] => {
      const scalar = randBetween(N - 1n);
      const point = secp256k1.ProjectivePoint.BASE.multiply(scalar);
      return [scalar, point.toAffine()];
};

export const sampleScalar = (): bigint => randBetween(N - 1n);

// Identity point? TODO: check if this is the right way to do it
export const isIdentity = (point: ProjectivePoint) => {
      return (point.px === 0n && point.py === 0n) || point.pz === 0n;
};

export const pointToJSON = (point: AffinePoint): AffinePointJSON => {
      return {
            xHex: point.x.toString(16),
            yHex: point.y.toString(16),
      };
};

export const pointFromJSON = (point: AffinePointJSON): AffinePoint => {
      return {
            x: BigInt(`0x${point.xHex}`),
            y: BigInt(`0x${point.yHex}`),
      };
};
