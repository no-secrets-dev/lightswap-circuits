pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CommitmentHasher() {

    signal input nullifier;
    signal input root;
    signal input tokenA;
    signal input tokenB;
    signal input reserveA;
    signal input reserveB;
    signal input amountIn;
    signal input amountOut;
    signal input amountPreviouslyWithdrawn;
    signal input depositK;
    
    // Outputs - both commitment and nullifierHash
    signal output commitHash;
    signal output nullifierHash;

    // Generate commitment hash from all inputs
    component commitHasher = Poseidon(10);
    commitHasher.inputs[0] <== nullifier;
    commitHasher.inputs[1] <== root;
    commitHasher.inputs[2] <== tokenA;
    commitHasher.inputs[3] <== tokenB;
    commitHasher.inputs[4] <== reserveA;
    commitHasher.inputs[5] <== reserveB;
    commitHasher.inputs[6] <== amountIn;
    commitHasher.inputs[7] <== amountOut;
    commitHasher.inputs[8] <== amountPreviouslyWithdrawn;
    commitHasher.inputs[9] <== depositK;
    commitHash <== commitHasher.out;
    

    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;
}
