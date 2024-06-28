## ZKSCH: Schnorr Zero-Knowledge Proof

The proof called ZKSCH in this repository likely refers to a variant of the Schnorr Zero-Knowledge Proof (Schnorr ZKP), named after Claus Schnorr.

### Unique Aspects of ZKSCH (Schnorr ZKP):
- **Simplicity and Efficiency**: Schnorr ZKPs are known for their simplicity and computational efficiency, making them suitable for environments with limited computational resources.
- **Security Based on Discrete Logarithms**: The security of Schnorr ZKP relies on the hardness of the discrete logarithm problem, particularly within the context of elliptic curve cryptography (ECC) as used in this example.
- **Non-interactive Variants**: Schnorr ZKP can be transformed into a non-interactive proof using the Fiat-Shamir heuristic, which makes it practical for many cryptographic applications, such as digital signatures.

### How ZKSCH Works Compared to Other ZK Proofs:
- **Commitment and Challenge**: Like many ZKPs, ZKSCH involves a commitment phase (generating a random value and computing a corresponding commitment) and a challenge phase (computing a challenge from the commitment and public values).
- **Response Calculation**: The response in Schnorr ZKP is computed to tie the random commitment and the challenge to the prover's secret, ensuring that the verifier can confirm the prover's knowledge without revealing the secret.
- **Efficiency**: Due to its reliance on simple arithmetic operations over elliptic curve groups, ZKSCH is generally more efficient compared to other more complex ZKPs like zk-SNARKs, which involve heavy polynomial computations and zero-knowledge succinctness.

In summary, ZKSCH (Schnorr ZKP) stands out due to its efficiency, simplicity, and reliance on well-established cryptographic hardness assumptions, making it a robust choice for zero-knowledge proofs in various cryptographic protocols.


## Pre-Requsites
Anyone with basic proficcency in typescript and basic knowdelge of what ZKP's are can follow this tutorial. However before we exlain how the proof works aswell as breaking down the code, there are some definitions and some background
knowledge i want to cover that is crucial to understand if you want to know whats going on in the implementation. 

### Elliptic Curves and (Secp256k1 curve)
All zero knowledge proofs implement arithemtic operations based off of some elliptic curve. Many of the different ZKP algorithms use series mathematical operations to both create and generate proofs. All of these operations are usually
scalar point operations such as `multiply' 'add' 'subtract' etc, that use linear algebra to do arithmetic on points that lie on the underlying elliptic curve with different scalars that are involved in said algorithm at hand.
The good thing is there are only a couple of different types of arithmetic operations that get used. the most important ones are

### Jacobian Addition

Jacobian addition is a method used to add two points \( P = (x1, y1) \) and \( Q = (x2, y2) \) on the elliptic curve in Jacobian coordinates. The process involves:

1. **Conversion to Jacobian coordinates**: Convert \( P \) and \( Q \) from affine coordinates to Jacobian coordinates.
   
2. **Point addition**: Perform the addition operation in Jacobian coordinates using specific formulas derived from the elliptic curve group law.

3. **Conversion back to affine coordinates**: Convert the resulting point \( R \) from Jacobian coordinates back to affine coordinates.

Jacobian addition is favored for its efficiency in cryptographic applications where multiple operations are performed.

### Jacobian Multiplication

Jacobian multiplication refers to the scalar multiplication \( Q = kP \), where \( k \) is a scalar and \( P \) is a point on the elliptic curve. Steps include:

1. **Point doubling**: Efficiently double a point in Jacobian coordinates.
   
2. **Scalar multiplication**: Compute \( kP \) by combining doubling and addition operations based on the binary representation of \( k \).

3. **Conversion back to affine coordinates**: Convert the resulting point \( Q \) from Jacobian coordinates back to affine coordinates if needed.

## Elliptic Curve Point format
When doing these arithemtic operations on EC points in an ZKP formula, particularly with curves like secp256k1, we usually operate on the points in differnt coordinate-system formats, such as affine and projective coordinates.

### Affine Points
An affine point \( P \) is represented as \( (x, y) \) where \( x \) and \( y \) are coordinates satisfying the elliptic curve equation. Affine points are commonly used to represent cryptographic keys (e.g., public keys) and are a standard output format for most cryptographic operations. They are also straightforward to add and subtract. but they are not efficent for multiplying with
scalars, when doing scalar point multiplication we usually will convert from Affine to the Projective point coordinate system

### Projective Points
A projective point \( (X, Y, Z) \) consists of three coordinates \( X, Y, \) and \( Z \), where \( (X/Z, Y/Z) \) represents the corresponding affine point. Unlike Affine points Projective coordinates allow for efficient point addition and scalar multiplication by exploiting the structure of elliptic curves.
Projective points are used internally in many elliptic curve algorithms (e.g., ECDSA, Schnorr) for efficient point operation

During our implementation below you will often see the conversion of things like `the proovers public key and secret` from Affine coordinates (x,y) to projective coordinates (x,y,z) for more efficent scalar point operations like `multiply`
that are required by the schnorr SCH Proof.

## Overview Of The Schnorr ZKP 
Now we will go over the Schnorr ZKP algorithm explaining each component followed by a step by step code walkthrough. The goal is to generate a proof that demonstrates knowledge of a secret without revealing the secret itself. Before look at the base algorithm its important to understand some definitions that are common in
all ZKP algorithms.

### Key Definitions
  - **nonce:**: Zkps use randomly sampled values from the curve as a nonce. the nonce ensures randomness and unpredictability throughout the proof. It adds a layer of security by ensuring that each proof is unique, even if the same secret is used multiple times.The commitment is a point on the elliptic curve derived from the nonce.
  - **commitment:**: The commitment is a point on the elliptic curve derived from the nonce from a scalar point multiplication. the commitment is just the curves generator multiplied by the nonce. The commitment serves as a "blinded" version of the nonce, allowing the verifier to later check the validity of the proof without revealing the nonce itself. ZKSCH involves a commitment phase (generating a random value and computing a corresponding commitment) and a challenge phase (computing a challenge from the commitment and public values).
  - **challenge:**: A challenge is an operation during the proof generation to compute a challenge from the commitment and public values. This challenge is used to tie the proof to the proovers secret and commitment. in the verification function the verifier needs to recompute this challenge in order to be able to verify the proof. 

### SCH ZK Process
1. **Prover's Steps:**
   - **Generate a nonce:**: Select a random nonce `k` from a sufficiently large space.
   - **Compute commitment:**: Compute the commitment `R = k * G`, where `G` is the base point of the elliptic curve.
   - **Create challenge:**: Compute the challenge `e = H(R || M)`, where `H` is a cryptographic hash function combining `R` with additional message data `M`.
   - **Compute response:**: Calculate the response `s = k + e * x`, where `x` is the secret.
   - **Construct proof:**: Provide the proof `(R, s)` to the verifier.

2. **Verifier's Steps:**
   - **Recompute commitment:**: Compute `R' = s * G - e * publicKey`.
   - **Verify the proof:**: Accept the proof if `R == R'`, indicating that the prover possesses the secret without revealing `x`.

### Our Implementation Overview
our implementation will apply the above formual from schnorr. We will write three main functions. `CreateProof`, `VerifyProof` and `CreateRandomness`. However before we breakdown the code its important to understand these definitions that are common in
all ZKP algorithms

## createProof
The create Proof Function will implement the algorithm described above. Here is the code

```ts
// MAIN SCH ZK logic/algorithm
export const zkSchProve = (
      r: ZkSchRandomness,
      pubPoint: AffinePoint,
      secret: bigint
): bigint | null => {
      const gen = secp256k1.ProjectivePoint.BASE;

      if (
            isIdentity(secp256k1.ProjectivePoint.fromAffine(pubPoint)) ||
            secret === 0n
      ) {
            return null;
      }

      const e = challenge(r.commitment, pubPoint, gen);
      const es = modMultiply([e, secret], N);
      const Z = modAdd([es, r.a], N);

      return Z;
};
```
the `createProof` function requires 3 arguments. 
### Parameters:
- `r`: r is an object which holds the ranom nonce we generate aswell as its commitment
- `pubPoint`: pubPoint here is The proovers public key corresponding to the secret value were using for the proof.
- `secret`: the secret value for the proof which is only known to the proover

## Step1
the first thing we need is to define the generator point. The generator is used as the base point which we preform curve arithemtic on as part of the Proofs algorithm. Usually the generator just used the base point
associated with the curve. In this case the secp256k1's generator point
```ts
const gen = secp256k1.ProjectivePoint.BASE;
```

## Step2
before we start the main logic we do a simple check to make sure our arguments are correct. For example we need to assert that the users public key's x and y coordinates are not zero.
```ts
 if (
            isIdentity(secp256k1.ProjectivePoint.fromAffine(pubPoint)) ||
            secret === 0n
      ) {
            return null;
      }
```
Note that our public point is in Affine cordinate format, meaning that is defined over the (x,y) coordinate system. for this check we want out publicPoint in Project coordinate system, or in other words we want it in (x,y,z) format. When we do this conversion x and y remain the same
```ts
(secp256k1.ProjectivePoint.fromAffine(pubPoint)
```

## Step 3
The next step is to generate the proofs challenge from the supplied commitment and public key. remember that the challenege is used to tie together the final proof with the users public point and commitment. that way when the verifier reconstructs it, they can verify the proof only if their reconstruction matches the original challenge. if the challegned doesnt match, then the verifier knows either the provided commitment or proof is incorrect.
```ts
 const e = challenge(r.commitment, pubPoint, gen);
 const es = modMultiply([e, secret], N);
```
the challenge is created by e = H(R || M)`, where `H` is a cryptographic hash function. for our purposes we will use sha256 for simplicity. The implementation of the challenge function is
```ts
const challenge = (
      commitment: AffinePoint,
      pubPoint: AffinePoint,
      gen: AffinePoint
): bigint => {
      const commitmentBuffer = serializeToPointBuffer(commitment);
      const pubPointBuffer = serializeToPointBuffer(pubPoint);
      const genBuffer = serializeToPointBuffer(gen);

      // to create our hash (we will use sha256 here) we just use the create hash
      //util from nodecrypto and encode in our commitment public and generator buffers
      const hash = crypto
            .createHash("sha256")
            .update(commitmentBuffer)
            .update(pubPointBuffer)
            .update(genBuffer)
            .digest();

      const bigHash = bytesToNumberBE(hash);
      const challenge = modAdd([bigHash, N - 2n ** 255n], N); // TODO

      return challenge;
};
```
alls this code is doing is hashing together the commitment, the proovers publicpoint and the generator we described above. We simply just use createHash from node crypto. However the reason we need to define
```ts
  const commitmentBuffer = serializeToPointBuffer(commitment);
  const pubPointBuffer = serializeToPointBuffer(pubPoint);
  const genBuffer = serializeToPointBuffer(gen);
```
is because we cannot hash these values in the point format, we need to convert them to Buffers, so that we can hash them together using the sha hasing function. To generate the final challenge we use the binint format of the hash and apply ad modulo add operation which simple applies a jacobian addition with the bigint hash with the Prime value of the secp256k1 curve whch is a constant.
```ts
const challenge = modAdd([bigHash, N - 2n ** 255n], N); // TODO
```

## Step4
The last step to generate the final proof is to apply a modulo add with the challenge and the initial commitment passed into the create proof function
```ts
const es = modMultiply([e, secret], N);
const Z = modAdd([es, r.a], N);
```
# VerifyProofy
The verify Proof Function will implement the algorithm described above for the verification part. Here is the code
```ts
export const zkSchVerifyProof = (
      p: ZkSchProof,
      pubPoint: AffinePoint,
): boolean => {
      //(P.C) are not null
      if (!zkSchIsProofValid(p)) {
            return false;
      }
      return zkSchVerifyResponse(p.Z, pubPoint, p.C);
};
```
the `verifyProof` function requires 2 arguments. 
### Parameters:
- `p`: r is an object which holds the proof generated by the prover as well as their commitment on the random nonce
- `pubPoint`: pubPoint here is The proovers public key corresponding to the secret value were using for the proof.

## Step1
the first step of the verify function is to check the supplied proof is valid format this just ensures that the proof itself (P.Z) and the commitment supplied with the proof (P.C) are defined and not null
```ts
if (!zkSchIsProofValid(p)) {
            return false;
      }
```

## Step2
we then run the main verification logic which follows the algorithm descrbed above
```ts
zkSchVerifyResponse(p.Z, pubPoint, p.C, genIn);
```
```ts
export const zkSchVerifyResponse = (
      z: bigint | null,
      pubPoint: AffinePoint,
      commitment: AffinePoint,
): boolean => {
      if (!z) {
            return false;
      }
      const gen = secp256k1.ProjectivePoint.BASE;

      const pubPointProj = secp256k1.ProjectivePoint.fromAffine(pubPoint);
      if (!z || !zkSchIsResponseValid(z) || isIdentity(pubPointProj)) {
            return false;
      }

      const e = challenge(commitment, pubPoint, gen);
      const lhs = gen.multiply(z);
      const rhs = pubPointProj
            .multiply(e)
            .add(secp256k1.ProjectivePoint.fromAffine(commitment));

      return lhs.equals(rhs);
};
```
Like we the did in the create proof function we  initialize the generator point we use for doing scalar point operations. (this should be same as it was in create proof).
```ts
const gen = secp256k1.ProjectivePoint.BASE;
```

## Step 3
The next step follow similar to the createProof function where we need to convert the users public key from affine point format to projecttive point format as projective is better suited for multiplication.
We then do a similar assertion on the functions proof and public point args to ensure they're in the correct format
```ts
const pubPointProj = secp256k1.ProjectivePoint.fromAffine(pubPoint);
      if (!z || !zkSchIsResponseValid(z) || isIdentity(pubPointProj)) {
            return false;
      }
```
## Step 4
The next step is to reconstruct the challenge from the supplied proofs commitment and proovers public key. 
```ts
 const e = challenge(commitment, pubPoint, gen);
```
The reconstructed challenge is expected to match the original. if it doesnt then the proof is invalid will fail to verify.

## Step 5
To verify the proof, we use the reconstructed challenge, the proof and commitment to compute two new values and assert their equality. For the first value LHS, we need to apply a multplication to the supplied proof with the curves generator point to obtain a value. 
```ts
const lhs = gen.multiply(z);
```
Then we need to compute another value from a multplication operation of the generator point by the reconstructed challenge aswell as an addition on this result by the supplied commitment.
```ts
const rhs = pubPointProj.multiply(e).add(secp256k1.ProjectivePoint.fromAffine(commitment));
```
If these two values are equal meaning LHS === RHS, then we have successfully verified the proof as per schnoors algorithm
```
 return lhs.equals(rhs);
```
