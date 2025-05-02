import { WitnessTester , CircuitSignals } from "circomkit";
import { circomkit } from "./common";
import { buildPoseidonOpt } from "circomlibjs";
import { expect } from 'chai';
import { 
    initMerkleTree, 
    insertLeaf,
    generateRandomMerkleTree,
    generateMerkleProof,
} from "./utils/merkle";
// import { randomBytes } from "crypto";

describe("withdraw", () => {
    const levels = 20; 
    let withdrawCircuit: WitnessTester;
    let poseidon: any;
    let merkleRoot: any;
    let amountOut: any;
    const testCase = {
        tokenA: "1",
        tokenB: "2",
        reserveA: "10000000000",
        reserveB: "5000000000",
        amountIn: "1000000",
        zeroToOne: "0",
        depositK: "50000000000000000000",
        nullifier: "67890"
    };

    function poseidonHash(inputs: Array<bigint>) {
        return poseidon.F.toObject(poseidon(inputs.map(x => poseidon.F.e(x))));
    }

    before(async () => {

        withdrawCircuit = await circomkit.WitnessTester("withdraw_20", {
            file: "withdraw",
            template: "WithdrawVerifier",
            params: [levels],
        });

        poseidon = await buildPoseidonOpt();
    });

    // TESTING THE TESTING UTILS
    it("test-poseidon", async function() {
        const expectedHash = 810801969239164569727458060830021442859715985435828625792818444251603252129n;
        const bigintArray1 = [1n, 2n, 3n, 10000n, 12345678901234567890n];
        const hashOut = poseidonHash(bigintArray1);
        expect(hashOut).to.equal(expectedHash, "Hash doesn't match expected value");
    });

    it("test-tree", async function(){
        let newTree = await initMerkleTree();
        console.log("init merkle root is:", newTree.root);
        
        let randomTree = await generateRandomMerkleTree(20, 20);
        console.log("randomTree root is:", randomTree.root);
    });

    // TESTING THE CIRCUIT
    it("test-completeness-1", async function() {
        const reserveIn = BigInt(testCase.reserveA);
        const reserveOut = BigInt(testCase.reserveB);
        const amountIn = BigInt(testCase.amountIn);
        const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);

        console.log(`Calculated amountOut: ${amountOut}`);

        const tree = await generateRandomMerkleTree(5, 20); 
        console.log(`random Merkle tree root: ${tree.root}`);

        const nullifierHash = await poseidonHash([BigInt(testCase.nullifier)]);
        console.log(`Nullifier hash: ${nullifierHash}`);

        const amountPreviouslyWithdrawn = BigInt(0);
        const amountToWithdraw = amountOut;
        const commitmentInputs = [
            BigInt(testCase.nullifier),
            BigInt(tree.root.toString()),
            BigInt(testCase.tokenA),
            BigInt(testCase.tokenB),
            BigInt(testCase.reserveA),
            BigInt(testCase.reserveB),
            BigInt(testCase.amountIn),
            BigInt(amountOut),
            BigInt(amountPreviouslyWithdrawn),
            BigInt(testCase.depositK)
        ];
        const commitHash = await poseidonHash(commitmentInputs);
        console.log(`Commitment hash: ${commitHash}`);

        const { tree: updatedTree, leafIndex } = await insertLeaf(tree, commitHash);
        console.log(`Updated Merkle root after insertion: ${updatedTree.root}`);
        console.log(`Commitment inserted at leaf index: ${leafIndex}`);


        const merkleProof = generateMerkleProof(updatedTree, leafIndex);
        console.log(`Merkle proof generated with ${merkleProof.pathElements.length} path elements`);

        // for (let i = 0; i < merkleProof.pathElements.length; i++) {
        //     console.log(`Path element ${i}: ${merkleProof.pathElements[i]}, Path index: ${merkleProof.pathIndices[i]}`);
        // }

        type WithdrawSignals = [
        "root", "tokenA", "tokenB", "amountIn", "zeroToOne", "depositK", "nullifierHash",
        "reserveA", "reserveB", "amountOut", "amountPreviouslyWithdrawn", "amountToWithdraw",
        "nullifier", "pathElements", "pathIndices"
    ];

        const withdrawCircuit = await circomkit.WitnessTester<WithdrawSignals>("withdraw_20", {
            file: "withdraw",
            template: "WithdrawVerifier",
            params: [20]
        });


        const circuitInput = {
            root: Number(updatedTree.root.toString()),
            tokenA: Number(testCase.tokenA),
            tokenB: Number(testCase.tokenB),
            amountIn: Number(testCase.amountIn),
            zeroToOne: Number(testCase.zeroToOne),
            depositK: Number(testCase.depositK),
            nullifierHash: Number(nullifierHash.toString()),
            reserveA: Number(testCase.reserveA),
            reserveB: Number(testCase.reserveB),
            amountOut: Number(amountOut.toString()),
            amountPreviouslyWithdrawn: Number(amountPreviouslyWithdrawn.toString()),
            amountToWithdraw: Number(amountToWithdraw.toString()),
            nullifier: Number(testCase.nullifier),
            pathElements: merkleProof.pathElements.map(el => Number(el.toString())),
            pathIndices: merkleProof.pathIndices
        };

        console.log(`Nullifier (raw): ${testCase.nullifier}`);
        console.log(`Nullifier (BigInt): ${BigInt(testCase.nullifier)}`);
        console.log(`Nullifier (Number): ${Number(testCase.nullifier)}`);
        console.log("Circuit input prepared");


        await withdrawCircuit.expectPass(circuitInput);

        
    });
    it("test-soundness-1", async function(){
        const reserveIn = BigInt(testCase.reserveA);
        const reserveOut = BigInt(testCase.reserveB);
        const amountIn = BigInt(testCase.amountIn);
        const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);

        console.log(`Calculated amountOut: ${amountOut}`);

        const tree = await generateRandomMerkleTree(5, 20); 
        console.log(`random Merkle tree root: ${tree.root}`);

        const nullifierHash = await poseidonHash([BigInt(testCase.nullifier)]);
        console.log(`Nullifier hash: ${nullifierHash}`);

        const amountPreviouslyWithdrawn = BigInt(0);

        // EXCESSIVE WITHDRAWAL
        const amountToWithdraw = amountOut + 1n;

        const commitmentInputs = [
            BigInt(testCase.nullifier),
            BigInt(tree.root.toString()),
            BigInt(testCase.tokenA),
            BigInt(testCase.tokenB),
            BigInt(testCase.reserveA),
            BigInt(testCase.reserveB),
            BigInt(testCase.amountIn),
            BigInt(amountOut),
            BigInt(amountPreviouslyWithdrawn),
            BigInt(testCase.depositK)
        ];
        const commitHash = await poseidonHash(commitmentInputs);
        console.log(`Commitment hash: ${commitHash}`);

        const { tree: updatedTree, leafIndex } = await insertLeaf(tree, commitHash);
        console.log(`Updated Merkle root after insertion: ${updatedTree.root}`);
        console.log(`Commitment inserted at leaf index: ${leafIndex}`);


        const merkleProof = generateMerkleProof(updatedTree, leafIndex);
        console.log(`Merkle proof generated with ${merkleProof.pathElements.length} path elements`);

        // for (let i = 0; i < merkleProof.pathElements.length; i++) {
        //     console.log(`Path element ${i}: ${merkleProof.pathElements[i]}, Path index: ${merkleProof.pathIndices[i]}`);
        // }

        type WithdrawSignals = [
        "root", "tokenA", "tokenB", "amountIn", "zeroToOne", "depositK", "nullifierHash",
        "reserveA", "reserveB", "amountOut", "amountPreviouslyWithdrawn", "amountToWithdraw",
        "nullifier", "pathElements", "pathIndices"
    ];

        const withdrawCircuit = await circomkit.WitnessTester<WithdrawSignals>("withdraw_20", {
            file: "withdraw",
            template: "WithdrawVerifier",
            params: [20]
        });


        const excessiveWithdrawalInput = {
            root: Number(updatedTree.root.toString()),
            tokenA: Number(testCase.tokenA),
            tokenB: Number(testCase.tokenB),
            amountIn: Number(testCase.amountIn),
            zeroToOne: Number(testCase.zeroToOne),
            depositK: Number(testCase.depositK),
            nullifierHash: Number(nullifierHash.toString()),
            reserveA: Number(testCase.reserveA),
            reserveB: Number(testCase.reserveB),
            amountOut: Number(amountOut.toString()),
            amountPreviouslyWithdrawn: Number(amountPreviouslyWithdrawn.toString()),
            amountToWithdraw: Number(amountToWithdraw.toString()),
            nullifier: Number(testCase.nullifier),
            pathElements: merkleProof.pathElements.map(el => Number(el.toString())),
            pathIndices: merkleProof.pathIndices
        };

        console.log(`Nullifier (raw): ${testCase.nullifier}`);
        console.log(`Nullifier (BigInt): ${BigInt(testCase.nullifier)}`);
        console.log(`Nullifier (Number): ${Number(testCase.nullifier)}`);
        console.log("Circuit input prepared");


        console.log("Testing circuit with excessive withdrawal amount...");
        try {
            await withdrawCircuit.expectFail(excessiveWithdrawalInput);
            console.log("Circuit correctly rejected excessive withdrawal");
        } catch (error) {
            console.error("Circuit did not reject excessive withdrawal as expected:", error);
            throw error;
        }

    });

});
