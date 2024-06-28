import { secp256k1 } from "@noble/curves/secp256k1";

import { modAdd, modMultiply } from "bigint-crypto-utils";
import type { Hasher } from "./lib/Hasher.js";
import type {
      AffinePoint,
      ZkSchProof,
      ZkSchRandomness,
} from "./lib/types/common.types.js";
import { isIdentity, sampleScalar } from "./lib/utils.js";

export const N = secp256k1.CURVE.n;

// Step1 CREATE PROOF
export const zkSchCreateProof = (
      hasher: Hasher,
      pubPoint: AffinePoint,
      priv: bigint,
      gen: AffinePoint
): ZkSchProof | null => {
      // start by generating a random nonce which will be used
      // to ensure ranomness and unpredicability throughout the proof
      // the nonce is also tied to a point on the Secp256k1 curve as a hash point
      // so that we can check verify the nonce without revealing its original value
      const a = zkSchCreateRandomness(gen);

      // call main proove function with
      // 1) - the nonce and its commitment
      // 2) - a hash function
      // 3) - the creators public key (tied to secret)
      // 4) the private secret value
      // 5) an optional generator point used for scalar point operations
      // if this is not defined the secp curves base generator point is used (N)
      const Z = zkSchProve(a, hasher, pubPoint, priv, gen);

      if (!Z) {
            return null;
      }

      // return the computed proof and the initial commitment. the verifier will
      // use the proof and commitment to verify the proof their side
      return {
            C: a.commitment,
            Z,
      };
};

// MAIN SCH ZK logic/algorithm
export const zkSchProve = (
      r: ZkSchRandomness,
      hasher: Hasher,
      pubPoint: AffinePoint,
      secret: bigint,
      genIn?: AffinePoint
): bigint | null => {
      // initialize the generator point we use for doing scalar point operations
      // we use the secp's default generator point by default unless a specific generator
      // is defined. Note the default generator is N
      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;

      if (
            // this check just serves to ensure that the x/y points of the public key
            // are not both 0, and that the secret isnt 0 ether. to meet the criteria for
            //creating a proof the public key must have correct format and the secret cannot be 0
            isIdentity(secp256k1.ProjectivePoint.fromAffine(pubPoint)) ||
            secret === 0n
      ) {
            return null;
      }

      // SCHNORS ZK Algorithm
      // compute challenge e=H(R∥M) where R=k⋅G, H is a hash function and M is message signed
      // calculate s=k+e⋅x mod n where n is the order of the secp curve
      // the proof is RS

      // the first step is to create the challenge. the challenge generated here
      //is used in the creation of the proof. later the verify will reconstruct this
      //challenge using the initial commitment/users public and the generator
      //which are all public constants. since the challegne is tied to the proof,
      //if the reconstructed challenge geneated later is different we know data has been tampered
      // in our implementation the message M from the formula is tied in with the commitment
      // also R=k.G represents our nonce and its commitment
      const e = challenge(hasher, r.commitment, pubPoint, gen);
      const es = modMultiply([e, secret], N);
      const Z = modAdd([es, r.a], N);

      // the three steps above are just following the Schnorr algorithm and are not anything
      //we need to come up with outselves. when coding ZKps were alwasy just implementing an
      //algorthim created by a cryptographer
      return Z;
};

// VERIFY
export const zkSchVerifyProof = (
      p: ZkSchProof,
      hasher: Hasher,
      pubPoint: AffinePoint,
      genIn: AffinePoint
): boolean => {
      // the first step of the verify function is to check the supplied proof is valid format
      // this just ensures that the proof itself (P.Z) and the commitment supplied with the proof
      //(P.C) are not null
      if (!zkSchIsProofValid(p)) {
            return false;
      }
      // then we run the main verify logic which follows schnoors verify algorithm
      return zkSchVerifyResponse(p.Z, hasher, pubPoint, p.C, genIn);
};

export const zkSchVerifyResponse = (
      z: bigint | null,
      hasher: Hasher,
      pubPoint: AffinePoint,
      commitment: AffinePoint,
      genIn?: AffinePoint
): boolean => {
      if (!z) {
            return false;
      }

      //Like the did in the create proof function we  initialize the generator point
      // we use for doing scalar point operations. (this should be same as it was in create proof)
      // we use the secp's default generator point by default unless a specific generator
      // is defined. Note the default generator is N
      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;

      //the first thing we need to do is to convert the users public key from affine point format
      // to projecttive point format. the point will initially be in affine format which is (x,y) coords. Generally when doing
      //point aritmetic we prefer projective point format which is just the point in (x,y,z) x and y and z cordinates
      // so all that happens here is we conver public from (x,y) to (x,y,z) x any y dont change and z is usually 1
      const pubPointProj = secp256k1.ProjectivePoint.fromAffine(pubPoint);
      if (!z || !zkSchIsResponseValid(z) || isIdentity(pubPointProj)) {
            return false;
      }

      // we then recompute the challenge as the verifier using the commitment
      //supplied with the proof, the proovers public and the generator. this
      //chamllenge should be the same as the challenged geneated in creat proof. if its not
      // our proof will fail to verify
      const e = challenge(hasher, commitment, pubPoint, gen);

      // to verify the proof we apply schnoors algorith, and asset that the LHS === RHS
      // of our calculations. the LHS is defined as the scar point multiplication of the generator
      // point by the proovers supplied proof
      const lhs = gen.multiply(z);

      //to compute the RHS, as per schnoors formula we do a mul/add operation of the
      //proovers public in projective point format where our multiply scalr is e, the reconstructed
      //challenge and the addition scalar is the initial commitment in projective point format
      const rhs = pubPointProj
            .multiply(e)
            .add(secp256k1.ProjectivePoint.fromAffine(commitment));

      // if these two computations are the same we have successfully verified the proof
      return lhs.equals(rhs);
};

// CHALLENGE
const challenge = (
      hasher: Hasher,
      commitment: AffinePoint,
      pubPoint: AffinePoint,
      gen: AffinePoint
): bigint => {
      const bigHash = hasher.updateMulti([commitment, pubPoint, gen]).digestBigint();

      const challenge = modAdd([bigHash, N - 2n ** 255n], N); // TODO

      return challenge;
};

// GENERATE RANDOM NONCE & TIE IT COMMITMENT ON CURVE
export const zkSchCreateRandomness = (genIn?: AffinePoint): ZkSchRandomness => {
      const gen = genIn
            ? secp256k1.ProjectivePoint.fromAffine(genIn)
            : secp256k1.ProjectivePoint.BASE;

      // to generate an random nonce we can just sample a ranom scalar point a on the secp curve
      const a = sampleScalar();

      // to tie the nonce to commitment we just multiply our generator with the nonce to create
      // another point of the curve which is a multiple of a (hence is tied to a's value without revealing a itself)
      const commitment = gen.multiply(a).toAffine();
      return { a, commitment };
};

// VALIDATION HELPER FUNCTIONS
const zkSchIsCommitmentValid = (c: AffinePoint): boolean => {
      if (!c || isIdentity(secp256k1.ProjectivePoint.fromAffine(c))) {
            return false;
      }
      return true;
};

export const zkSchIsResponseValid = (z: bigint): boolean => {
      if (!z || z === 0n) {
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
