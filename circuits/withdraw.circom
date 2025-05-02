pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleTree.circom";
include "./swap.circom";

template WithdrawVerifier(levels) {

    signal input root;
    signal input tokenA;
    signal input tokenB;
    signal input amountIn;
    signal input zeroToOne; 
    signal input depositK;
    signal input nullifierHash;
    

    signal input reserveA;
    signal input reserveB;
    signal input amountOut;
    signal input amountPreviouslyWithdrawn;
    signal input amountToWithdraw;


    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // INTERNAL
    signal commitHash;
    signal reserveInPartA;
    signal reserveInPartB;
    signal oneMinusZeroToOne;
    signal reserveOutPartA;
    signal reserveOutPartB;
    signal reserveIn;
    signal reserveOut;

    zeroToOne * (1 - zeroToOne) === 0;

    // COMPUTE COMMITMENT HASH
    component commitmentHasher = CommitmentHasher();
    commitmentHasher.nullifier <== nullifier;
    commitmentHasher.root <== root;
    commitmentHasher.tokenA <== tokenA;
    commitmentHasher.tokenB <== tokenB;
    commitmentHasher.reserveA <== reserveA;
    commitmentHasher.reserveB <== reserveB;
    commitmentHasher.amountIn <== amountIn;
    commitmentHasher.amountOut <== amountOut;
    commitmentHasher.amountPreviouslyWithdrawn <== amountPreviouslyWithdrawn;
    commitmentHasher.depositK <== depositK;
    

    commitHash <== commitmentHasher.commitHash;
    commitmentHasher.nullifierHash === nullifierHash;

    component merkleVerifier = MerkleTreeChecker(levels);
    merkleVerifier.leaf <== commitHash;
    merkleVerifier.root <== root;
    
    for (var i = 0; i < levels; i++) {
        merkleVerifier.pathElements[i] <== pathElements[i];
        merkleVerifier.pathIndices[i] <== pathIndices[i];
    }

    oneMinusZeroToOne <== 1 - zeroToOne;
    reserveInPartA <== zeroToOne * reserveA;
    reserveInPartB <== oneMinusZeroToOne * reserveB;
    reserveOutPartA <== zeroToOne * reserveB;
    reserveOutPartB <== oneMinusZeroToOne * reserveA;


    reserveIn <== reserveInPartA + reserveInPartB;
    reserveOut <== reserveOutPartA + reserveOutPartB;

    component swapVerifier = SwapVerifier();
    swapVerifier.reserveIn <== reserveIn;
    swapVerifier.reserveOut <== reserveOut;
    swapVerifier.amountIn <== amountIn;
    swapVerifier.amountOut <== amountOut;

    
    component withdrawalVerifier = WithdrawalLimitVerifier();
    withdrawalVerifier.amountPreviouslyWithdrawn <== amountPreviouslyWithdrawn;
    withdrawalVerifier.amountToWithdraw <== amountToWithdraw;
    withdrawalVerifier.amountOut <== amountOut;
}
