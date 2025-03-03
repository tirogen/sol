import { createTree, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { airdropIfRequired, getKeypairFromFile } from "@solana-developers/helpers";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const user = await getKeypairFromFile("../keys/tkx.json");
  console.log("Loaded user", user.publicKey.toBase58());

  await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

  const umi = createUmi(connection.rpcEndpoint).use(mplBubblegum());
  const keypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  const signer = createSignerFromKeypair(umi, keypair); // equivalent to using the `generateSigner`
  umi.use(signerIdentity(signer)); // Register a new keypair as the identity and payer.

  const merkleTree = generateSigner(umi);
  console.log(`Generated merkleTree ${merkleTree.publicKey.toString()}`);

  console.log(`Creating Tree...`);
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 16,
    maxBufferSize: 64,
    public: false,
  });
  const tx = await builder.sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Created Tree! Signature is ${signature}`);
};

run();

// Loaded user tkxWCBPMGdRximWsuDfCnssywMNLKmVBQdbpQ9pmJry
// Generated merkleTree Hgpj3wb9vdQ8GCWkCRi88nw6pTmtVeZgpfSznZrU1CsM
// Creating Tree...
// 🖼️ Created Tree! Signature is 2naHfkuPZYTZtr6EDCQEZEF766jcPSom2VJ97vJZcBgW2THsRnTi7KR5RXwxPTSf6x5NCYpzUSvRVmuwaCfKcCg9
