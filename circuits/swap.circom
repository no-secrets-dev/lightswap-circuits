pragma circom 2.1.6;
include "../node_modules/circomlib/circuits/comparators.circom";
include "./commitment.circom";

template SwapVerifier() {
    signal input reserveIn;
    signal input reserveOut;
    signal input amountIn;
    signal input amountOut;

    signal amountInReserveOut;
    signal reserveInPlusAmountIn;
    signal reserveInPlusReserveOut;

    amountInReserveOut <== amountIn * reserveOut;
    reserveInPlusAmountIn <== reserveIn + amountIn;
    
    amountOut * reserveInPlusAmountIn === amountInReserveOut;
}

template WithdrawalLimitVerifier() {
    signal input amountPreviouslyWithdrawn;
    signal input amountToWithdraw;
    signal input amountOut;
    
    signal totalWithdrawal;

    totalWithdrawal <== amountPreviouslyWithdrawn + amountToWithdraw;
    
    // number of bits might be wrong
    component leq = LessEqThan(252);
    leq.in[0] <== totalWithdrawal;
    leq.in[1] <== amountOut;

    leq.out === 1;
}
