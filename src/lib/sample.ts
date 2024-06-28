import { secp256k1 } from "@noble/curves/secp256k1";
import { randBetween } from "bigint-crypto-utils";

export const N = secp256k1.CURVE.n;

export const sampleScalarPointPair = (): [bigint, any] => {
      const scalar = randBetween(N - 1n);
      const point = secp256k1.ProjectivePoint.BASE.multiply(scalar);
      return [scalar, point.toAffine()];
};

export const sampleScalar = (): bigint => randBetween(N - 1n);
