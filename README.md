# Lightswap Circuits

Circuits for privacy-preserving AMM swaps on Solana.

## Overview

Lightswap is a privacy-focused automated market maker (AMM) protocol for Solana that leverages zero-knowledge proofs to enable confidential swaps. The circuits verify the validity of user deposits.

## Components

### Merkle Tree Circuit (`merkleTree.circom`)
Verifies authentication path showing a commitment exists in the deposit commitment tree, and that the nullifier hash was in fact derived from the secret (nullifier).

### Swap Circuit (`swap.circom`)
Validates mathematical correctness of AMM swap calculations.

### Withdraw Circuit (`withdraw.circom`)
Uses aforementioned circuits in withdrawal verification process.

## Usage/Testing
Run `npm install` to install dependencies. You should have `circom` compiler version >2.0.0 installed.

Then run `npx mocha` to run all tests or `npx mocha -g <test-name>` to run a specific one.
