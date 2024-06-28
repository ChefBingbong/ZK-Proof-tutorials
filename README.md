# Zero Knowledge Proof Tutorials & Implementations in Typescript
This repo contains full and detailed implementations aswell as detailed explanations for a collection of different ZK proofs that are commonly used in MPC protocols. Right now only an example for Sschnors ZKP is done, but i wil continue to add more as i get the chance. 

## Structure
Full code toorials and examples of different proofs are hosted in their own directory in he src folder. Each Proof repo constains its onw `ReadME.md` file for you to follow along with, and detailed explanations of the underlying algorithm, math, crypto terminology and code. There are also test files in each repo that you can run and execute to get an understanding of how to actually implement these proofs on real data. I recommend you clone this repo and play around with the code and try to add your own test cases. it will help you get a better understanding.

## Pre-Requsites
Anyone with basic proficcency in typescript and basic knowdelge of what ZKP's are can follow this tutorial. However before we exlain how the proof works aswell as breaking down the code, there are some definitions and some background
knowledge i want to cover that is crucial to understand if you want to know whats going on in the implementation. 

<details>
   <summary>recommended pre-requsite knowedge for following along</summary>
   
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
</details>
