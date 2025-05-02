# Lightswap Circuits

Circuits for privacy-preserving AMM swaps on Solana.

## Overview

Lightswap is a privacy-focused automated market maker (AMM) protocol for Solana that leverages zero-knowledge proofs to enable confidential swaps. The circuits verify the validity of user deposits.

## Components

### (`merkleTree.circom`)
Provides Merkle tree inclusion verification to prove that a commitment exists in the tree of valid deposits.

### Swap Circuit (`swap.circom`)
Validates mathematical correctness of AMM swap calculations.

### Withdraw Circuit (`withdraw.circom`)
Uses aforementioned circuits in withdrawal verification process.

## Usage/Testing
Run `npm install` to install dependencies. You should have `circom` compiler version >2.0.0 installed.

Then run `npx mocha` to run all tests or `npx mocha -g <test-name>` to run a specific one.
