import * as clibjs from 'circomlibjs';
import * as crypto from 'crypto';


let poseidonHasher: any = null;

async function initPoseidon(): Promise<any> {
  if (!poseidonHasher) {
    poseidonHasher = await clibjs.buildPoseidonOpt();
  }
  return poseidonHasher;
}

async function poseidonHash(inputs: (BigInt | string | number)[]): Promise<BigInt> {
  const hasher = await initPoseidon();
  // Convert all inputs to BigInt
  const bigIntInputs = inputs.map(x => BigInt(x.toString()));
  const hashResult = hasher(bigIntInputs);
  return BigInt(hasher.F.toString(hashResult));
}

async function hashLeftRight(
  left: BigInt | string | number, 
  right: BigInt | string | number
): Promise<BigInt> {
  return await poseidonHash([left, right]);
}

interface MerkleTreeNodes {
  [key: string]: BigInt;
}

interface MerkleTree {
  levels: number;
  zero: BigInt[];
  root: BigInt;
  filled: number;
  nodes: MerkleTreeNodes;
}

interface MerkleProof {
  root: BigInt;
  pathElements: BigInt[];
  pathIndices: number[];
}

interface InsertResult {
  tree: MerkleTree;
  leafIndex: number;
}

async function initMerkleTree(levels: number = 20): Promise<MerkleTree> {

  const zero: BigInt[] = [];
  zero[0] = BigInt(0);

  for (let i = 1; i <= levels; i++) {
    zero[i] = await hashLeftRight(zero[i-1], zero[i-1]);
  }

  // Initialize tree structure
  const tree: MerkleTree = {
    levels,
    zero,
    root: zero[levels],
    filled: 0,
    nodes: {},
  };

  // Set default root
  tree.nodes[`0-${levels}`] = tree.root;

  return tree;
}

async function insertLeaf(tree: MerkleTree, leaf: BigInt | string | number): Promise<InsertResult> {
  const { levels, zero, filled } = tree;
  const leafIndex = filled;
  const nodes: MerkleTreeNodes = { ...tree.nodes };

  // Insert leaf
  nodes[`${leafIndex}-0`] = BigInt(leaf.toString());
  
  // Update path
  let currentIndex = leafIndex;
  for (let i = 0; i < levels; i++) {
    const nodeKey = `${currentIndex}-${i}`;
    const isLeft = currentIndex % 2 === 0;
    const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
    const siblingKey = `${siblingIndex}-${i}`;

    // Get sibling, or use zero value if not filled yet
    const sibling = nodes[siblingKey] || zero[i];

    // Calculate parent
    const parent = isLeft 
      ? await hashLeftRight(nodes[nodeKey], sibling)
      : await hashLeftRight(sibling, nodes[nodeKey]);

    // Store parent
    const parentIndex = Math.floor(currentIndex / 2);
    nodes[`${parentIndex}-${i+1}`] = parent;

    // Move up
    currentIndex = parentIndex;
  }

  // Update root
  const newRoot = nodes[`0-${levels}`];

  return {
    tree: {
      ...tree,
      filled: filled + 1,
      nodes,
      root: newRoot,
    },
    leafIndex
  };
}

async function generateRandomMerkleTree(numLeaves: number, levels: number = 20): Promise<MerkleTree> {
  let tree = await initMerkleTree(levels);

  for (let i = 0; i < numLeaves; i++) {
    const randomBytes = crypto.randomBytes(31); // 31 bytes to ensure it fits in Bn254 field
    const randomValue = BigInt('0x' + randomBytes.toString('hex'));

    const { tree: updatedTree } = await insertLeaf(tree, randomValue);
    tree = updatedTree;
  }

  return tree;
}

function generateMerkleProof(tree: MerkleTree, leafIndex: number): MerkleProof {
  const { levels, zero, nodes } = tree;
  const pathElements: BigInt[] = [];
  const pathIndices: number[] = [];

  let currentIndex = leafIndex;

  for (let i = 0; i < levels; i++) {
    const isLeft = currentIndex % 2 === 0;
    const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
    const siblingKey = `${siblingIndex}-${i}`;

    // Get sibling, or use zero value if it doesn't exist
    const sibling = nodes[siblingKey] || zero[i];

    pathElements.push(sibling);
    pathIndices.push(isLeft ? 0 : 1); 

    // Move to parent
    currentIndex = Math.floor(currentIndex / 2);
  }

  return {
    root: tree.root,
    pathElements,
    pathIndices
  };
}

export {
  poseidonHash,
  hashLeftRight,
  initMerkleTree,
  insertLeaf,
  generateRandomMerkleTree,
  generateMerkleProof,
  initPoseidon,
  MerkleTree,
  MerkleProof,
  InsertResult
};
