import { mintToCollectionV1, mplBubblegum, transfer } from "@metaplex-foundation/mpl-bubblegum";
import { createSignerFromKeypair, publicKey, signerIdentity, signTransaction } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));

  const umi = createUmi(connection.rpcEndpoint).use(mplBubblegum());
  const kxUser = await getKeypairFromFile("../keys/tkx.json");
  const kxKeypair = umi.eddsa.createKeypairFromSecretKey(kxUser.secretKey);
  const kxSigner = createSignerFromKeypair(umi, kxKeypair); // equivalent to using the `generateSigner`
  umi.use(signerIdentity(kxSigner)); // Register a new keypair as the identity and payer.

  const testUSer = await getKeypairFromFile("../keys/test.json");
  const testKeypair = umi.eddsa.createKeypairFromSecretKey(testUSer.secretKey);

  const merkleTree = publicKey("Hgpj3wb9vdQ8GCWkCRi88nw6pTmtVeZgpfSznZrU1CsM");
  const collectionMint = publicKey("9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62"); // token metadata collection

  const { blockhash } = await umi.rpc.getLatestBlockhash();
  const transaction = umi.transactions.create({
    version: 0,
    blockhash: blockhash,
    instructions: [
      ...mintToCollectionV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree,
        collectionMint,
        metadata: {
          name: "Bubble Corgi 2",
          uri: "https://devnet.irys.xyz/DKAXrdAJDPFDhx3LXFyFi6D7RoqNNNWPHjRDemniQnGc",
          sellerFeeBasisPoints: 500, // 5%
          collection: { key: collectionMint, verified: false },
          creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
        },
      }).getInstructions(),
      ...transfer(umi, {
        merkleTree: merkleTree,
        leafOwner: umi.identity.publicKey,
        newLeafOwner: testKeypair.publicKey,
      }).getInstructions(),
    ],
    payer: umi.identity.publicKey,
  });

  const signedTransactions = await signTransaction(transaction, [umi.identity]);
  const signature = await umi.rpc.sendTransaction(signedTransactions);
  console.log(`🖼️ Created Bubble Nft! Signature is ${base58.deserialize(signature)[0]}`);
};

run();
