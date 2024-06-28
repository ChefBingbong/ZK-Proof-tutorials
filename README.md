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

**Purpose**: Generates a zero-knowledge proof.

### Parameters:
- `secret`: The secret value for which the proof is being created.

### Process:
1. Generates a random nonce.
2. Computes the commitment using the nonce.
3. Creates the challenge using the commitment and the secret.
4. Computes the response using the nonce, secret, and challenge.
5. Returns the proof containing the commitment, challenge, and response.

## verifyProof

**Purpose**: Verifies the zero-knowledge proof.

### Parameters:
- `proof`: The proof to be verified.
- `publicKey`: The public key corresponding to the secret.

### Process:
1. Recomputes the challenge using the commitment and the public key.
2. Verifies that the response is consistent with the challenge and commitment.
3. Returns a boolean indicating the validity of the proof.

## challenge

**Purpose**: Computes a challenge value.

### Parameters:
- `commitment`: The commitment value.
- `secret`: The secret value.

### Process:
1. Hashes the commitment and secret to produce the challenge.