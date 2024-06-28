## ZKSCH: Schnorr Zero-Knowledge Proof

The ZKSCH proof that we will implement is a variant of the Schnorr Zero-Knowledge Proof (Schnorr ZKP), named after Claus Schnorr. This is a very simple proof to implement as its underlying algorithm is very simple an only involves a couple of steps. It is a great introductory proof which you can use to learn some of the more important techniques and definitions used im many ZKP algorithms.

<details>
  <summary>More on the ZKSCH proof!</summary>

  
### Unique Aspects of ZKSCH (Schnorr ZKP):
- **Simplicity and Efficiency**: Schnorr ZKPs are known for their simplicity and computational efficiency, making them suitable for environments with limited computational resources.
- **Non-interactive Variants**: Schnorr ZKP can be transformed into a non-interactive proof using the Fiat-Shamir heuristic, which makes it practical for many cryptographic applications, such as digital signatures. Although this is not the variant we will be applying here

### How ZKSCH Works Compared to Other ZK Proofs:
- **Commitment and Challenge**: Like many ZKPs, ZKSCH involves a commitment phase `(generating a random value and computing a corresponding commitment)` and a challenge phase (computing a challenge from the commitment and public values). The challenge and commitment are used to ensure both randomness and unpredictability in the proof
- **Response Calculation**: The `response in Schnorr ZKP` is computed to `tie` the random `commitment` and the `challenge` to the `prover's secret`, ensuring that the verifier can confirm the prover's knowledge without revealing the secret.
- **Efficiency**: Due to its reliance on simple arithmetic operations over elliptic curve groups, ZKSCH is generally more efficient compared to other more complex ZKPs like zk-SNARKs, which involve heavy polynomial computations and zero-knowledge succinctness.

</details>


### Pre-Requsites
Before continuing its important that you have read the **pre-requisite** section in the `ReadME.md` file at the base directory of this repo. You can find it [here](https://github.com/ChefBingbong/ZK-Proof-tutorials/README.md)

### Overview Of The Schnorr ZKP 
<details>
  <summary>read more on the ZKSCH algorithm definitions!</summary>

Now we will go over the Schnorr ZKP algorithm's mathematical definition, explaining each component followed by a step by step code walkthrough. The goal is to generate a proof that demonstrates knowledge of a secret without revealing the secret itself. Before look at the base algorithm its important to understand some definitions that are common in
all ZKP algorithms.

### Key Definitions
  - **nonce:**: Zkps use randomly sampled values from the underlying elliptic curve as a nonce. the nonce ensures randomness and unpredictability throughout the proof. It adds a layer of security by ensuring that each proof is unique, even if the same secret is used multiple times.
  - **commitment:**: The commitment is a point on the elliptic curve which is derived from the nonce by a scalar point multiplication. the commitment is just the curves generator multiplied by the nonce in our case. The commitment serves as a "blinded" version of the nonce, allowing the verifier to later check the validity of the proof without revealing the nonce itself.
  - **challenge:**: A challenge is an operation during the proof generation to compute a `challenge` from the commitment and proover's publicPoint values. This challenge is used to tie the proof to the proovers secret and commitment. in the verification function the verifier needs to recompute this challenge in order to be able to verify the proof. 

### SCH ZK Process
1. **Prover's Steps:**
   - **Generate a nonce:** Select a random nonce $\(k\)$ from a sufficiently large space.
   - **Compute commitment:** Compute the commitment $\(R = k \cdot G\)$, where $\(G\)$ is the base point of the elliptic curve.
   - **Create challenge:** Compute the challenge $\(e = H(R \| M)\)$, where $\(H\)$ is a cryptographic hash function combining $\(R\)$ with additional message data \(M\).
   - **Compute response:** Calculate the response $\(s = k + e \cdot x\)$, where $\(x\)$ is the secret.
   - **Construct proof:** Provide the proof $\((R, s)\)$ to the verifier.

2. **Verifier's Steps:**
   - **Recompute commitment:** Compute $\(R' = s \cdot G - e \cdot \text{publicKey}\)$.
   - **Verify the proof:** Accept the proof if $\(R = R'\)$, indicating that the prover possesses the secret without revealing $\(x\)$.


</details>


### Code Implementation Overview
our implementation will apply the above formula from schnorr's algorithm. We will write three main functions. `CreateProof`, `VerifyProof` and `CreateRandomness`.

## createProof
The create Proof Function will implement the `Proovers step` of algorithm described above. Here is the code

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
the first thing we need is to define the generator point. The generator is used as the base point which we preform some of the required curve arithemtic on as part of the Proofs algorithm. Usually the generator is just used the base point
associated with the curve $\(Gx, Gy)\$. In this case the `Secp256k1's` generator point
```ts
const gen = secp256k1.ProjectivePoint.BASE);
```

## Step2
before we start the main logic we do a simple check to make sure our arguments are correct. For example we need to assert that the users `public key's x and y coordinates` are not zero.
```ts
 if (
            isIdentity(secp256k1.ProjectivePoint.fromAffine(pubPoint)) ||
            secret === 0n
      ) {
            return null;
      }
```
Note that our public point is in `Affine cordinate` format, meaning that is defined over the $\(x,y)\$ coordinate system. for this check we want our publicPoint in the `Project coordinate system`, or in other words we want it in $\(x,y,z)\$ format. When we do this conversion $\x\$ and $\y\$ in the new Projective point are equivilent to $\(x/z, y/z)\$ from the Affine point
```ts
(secp256k1.ProjectivePoint.fromAffine(pubPoint)
```

## Step 3
The next step is to generate the proofs challenge from the supplied commitment and public key. Remember that the challenege is used to tie together the final proof with the users public point and commitment. that way when the verifier reconstructs it, they can verify the proof only if their reconstruction matches the original challenge. if the challegned doesnt match, then the verifier knows either the provided commitment or proof is incorrect.
```ts
 const e = challenge(r.commitment, pubPoint, gen);
 const es = modMultiply([e, secret], N);
```
the challenge is created by $\e = H(R || M)\$, where $\H\$ is a cryptographic hash function. for our purposes we will use sha256 for simplicity. the proof response `es` is defined as $\s = r.k + e * x\$, where we multiply the secret `x` with the challenge `e` and add `r.k` the random nonce The implementation of the challenge function is
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
const challenge = modAdd([bigHash, N - 2n ** 255n], N); 
```

## Step4
The last step to generate the final proof is to apply a modulo add with the challenge and the initial commitment passed into the create proof function to generate the final proof in accordance with $\proof = (r.a, es)\$
```ts
const es = modMultiply([e, secret], N);
const Z = modAdd([es, r.a], N);
```
# VerifyProofy
The verify Proof Function will implement the `Verifier Step` part of algorithm described above for the verification part. Here is the code
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
The next step follow similar to the createProof function where we need to convert the users public key from affine point format to projecttive point format as projective is better suited for multiplication. We then do a similar assertion on the functions proof and public point args to ensure they're in the correct format
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
