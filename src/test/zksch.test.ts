import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
      zkSchCreateProof,
      zkSchCreateRandomness,
      zkSchProve,
      zkSchVerifyProof,
      zkSchVerifyResponse,
} from "../zksch.js";
import { sampleScalar, sampleScalarPointPair } from "../lib/utils.js";
import { Hasher } from "../lib/Hasher.js";
import { secp256k1 } from "@noble/curves/secp256k1";

describe("zk/sch", () => {
      const hasher = Hasher.create().update("test");

      test("pass", () => {
            const a = zkSchCreateRandomness();
            const [x, X] = sampleScalarPointPair();

            const proof = zkSchProve(a, hasher.clone(), X, x);
            if (!proof) {
                  throw new Error("proof should not be null");
            }
            assert(
                  zkSchVerifyResponse(proof, hasher.clone(), X, a.commitment),
                  "failed to verify response"
            );
            assert(zkSchVerifyResponse(proof, hasher.clone(), X, a.commitment));
      });

      test("fail", () => {
            const a = zkSchCreateRandomness();
            const [x, X] = [
                  sampleScalar(),
                  secp256k1.ProjectivePoint.ZERO.toAffine(),
            ];
            const proof = zkSchProve(a, hasher.clone(), X, x);
            assert.equal(
                  zkSchVerifyResponse(proof, hasher.clone(), X, a.commitment),
                  false,
                  "proof should not accept identity point"
            );
      });

      test("createProof and verifyProof", () => {
            const gen = secp256k1.ProjectivePoint.BASE.toAffine();
            const secret = sampleScalar();
            const publicKey =
                  secp256k1.ProjectivePoint.BASE.multiply(secret).toAffine();

            const proof = zkSchCreateProof(hasher.clone(), publicKey, secret, gen);
            if (!proof) {
                  throw new Error("proof should not be null");
            }
            assert(
                  zkSchVerifyProof(proof, hasher.clone(), publicKey, gen),
                  "failed to verify proof created by createProof"
            );
      });
});
