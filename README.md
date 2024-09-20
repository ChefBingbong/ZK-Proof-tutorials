# Zero Knowledge Proof Tutorials & Implementations in Typescript

This repository contains full, `detailed implementations and explanations` for a collection of different `ZK proof algorithms` commonly used in MPC (multiparty computation) protocols. Currently, only an example for Schnorr's ZKP is completed, but I will continue to add more as I get the chance.

## Structure

The Full code tutorials and examples of the different proofs are hosted in their own directories in the `src` folder. Each proof repository contains its own `README.md` file for you to follow along with. Here you can find `detailed explanations` of the `underlying algorithms`, `the math involved`, `important crypto terminology`, and a line by line `breakdown of the code` implementation itself. There are also test files in each repository that you can run and execute to understand how to implement these proofs on real data. I recommend you clone this repository, play around with the code, and try to add your own test cases. It will help you gain a better understanding.

## How To Run
to set up on your local machine simply begin by cloning this repo
```sh
git clone https://github.com/ChefBingbong/ZK-Proof-tutorials.git
```
cd into the root directory
```sh
cd zk-tutorials/
```
install the project dependancies
```sh
pnpm i
```
run all tests
```sh
pnpm test
```

## Prerequisites

Anyone with `basic proficiency in Typescript` and `basic knowledge of what ZKPs are` can follow this tutorial. However, before we explain how the proof works and break down the code, there are some definitions and background knowledge that are crucial to understanding the implementation.

### Elliptic Curves and the Secp256k1 Curve

All zero-knowledge proofs implement arithmetic operations based on some `elliptic curve`. Many ZKP algorithms use a series of mathematical operations to both create and generate proofs according to some underlying algorithm. These operations are usually scalar point matrix operations such as `multiply`, `add`, etc that use linear algebra to do arithmetic on points that lie on the underlying elliptic curve with different scalars involved in the algorithm. A common curve used in Ethereum is the `Secp256k1` curve. `EVM EOA` addresses are actually just derived from `public keys` which are just a `point on one of these elliptic curves`. Nearly `all operations` in public key cryptography `boil down` to different combinations of arithmetic `operations of these curve posint coordinates`, wthether it be to store data, or to bind values to some point so that the new point can be used without revealing the underlying data

The good thing is there are only a few different types of arithmetic operations used. The most important ones are:

### Point Aritemtic & The Jacobian Co-ordinate System
`Jacobian aritemtic` is commonly used to preform `multiple aritemtic operations` on Projective or Affine `curve points`. The reason jacobian aritemtic is used is because its much more `efficent to do point operations` in the jacobian coordinate system compared to the Affine or projective cordinate systems, which points are commonly expressed in:

### Jacobian Addition
Jacobian addition is a method used to add two points $\( P = (x1, y1) \)$ and $\( Q = (x2, y2) \)$ on the elliptic curve in Jacobian coordinates. The `addition operation` in Jacobian coordinates uses specific `formulas derived from the elliptic curve group law` (properties of the crurve). Each curve has different properties. for example most curves have a base generator point $\(Gx,Gy)\$ that is commonly used in a lot of elliptic curve aritemtic. Jacobian addition is favored for its efficiency in cryptographic applications where multiple operations are performed.

### Jacobian Multiplication

Jacobian multiplication refers to the scalar multiplication $\( Q = kP \)$, where $\( k \)$ is a scalar and $\( P \)$ is a point on the elliptic curve. `Multiplication` is commonly used for `efficiently doubleing a point` in Jacobian coordinates. Jacobian multiplication is also commonly used to compute $\( kP \)$ by combining doubling and addition operations based on the binary representation of $\( k \)$.

## Elliptic Curve Point Formats

When performing these arithmetic operations on EC points in a ZKP formula, particularly with curves like secp256k1, we usually operate on the points in different coordinate-system formats (such as the Affine and Projective systems mentioned above), such as affine and projective coordinates.

### Affine Points

An affine point $\( P \)$ is represented as $\( (x, y) \)$ where $\( x \)$ and $\( y \)$ are coordinates satisfying the elliptic curve equation. `Affine points` are commonly used to `represent cryptographic keys` (e.g., public keys) and are a standard output format for most cryptographic operations. They are also straightforward to add and subtract but are not efficient for multiplying with scalars. When performing scalar point multiplication, we usually convert from affine to the projective point coordinate system.

### Projective Points

`A projective point` $\( (X, Y, Z) \)$ consists of `three coordinates` $\( X, Y, \)$ and $\( Z \)$, `where $\( (X/Z, Y/Z) \)$` represents the corresponding `affine point`. Unlike affine points, projective coordinates allow for efficient point addition and scalar multiplication by exploiting the structure of elliptic curves. Projective points are used internally in many elliptic curve algorithms (e.g., ECDSA, Schnorr) for efficient point operations.

During the different implementations in this repo, you will often see the conversion of things like `the prover's public key and secret` from affine coordinates $(x, y)$ to projective coordinates $(X, Y, Z)$ for more efficient scalar point operations like `multiply` that are required by the Schnorr SCH Proof.
