import {
  findLeafAssetIdPda,
  mintToCollectionV1,
  mplBubblegum,
  parseLeafFromMintToCollectionV1Transaction,
} from "@metaplex-foundation/mpl-bubblegum";
import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";
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

  const merkleTree = publicKey("Hgpj3wb9vdQ8GCWkCRi88nw6pTmtVeZgpfSznZrU1CsM");
  const collectionMint = publicKey("9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62"); // token metadata collection

  const tx = await mintToCollectionV1(umi, {
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
  }).sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Created Bubble Nft! Signature is ${signature}`);

  const leaf = await parseLeafFromMintToCollectionV1Transaction(umi, tx.signature);
  const assetId = findLeafAssetIdPda(umi, { merkleTree, leafIndex: leaf.nonce });
  console.log(`🍃 Created Leaf! AssetId is ${assetId.toString()}`);
};

run();

// 🖼️ Created Bubble Nft! Signature is iV5vLwtwu4pmcnyAnmyV7pME3HaUzEHjtyzAJ2XDxCpWbrFYR2S9Qca3M1Xri5LfvNp2kc2cWorEqCByQ8pyKWV
