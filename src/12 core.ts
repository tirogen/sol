import { create, fetchCollection, mplCore } from "@metaplex-foundation/mpl-core";
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

  const umi = createUmi(connection.rpcEndpoint).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  const signer = createSignerFromKeypair(umi, keypair); // equivalent to using the `generateSigner`
  umi.use(signerIdentity(signer)); // Register a new keypair as the identity and payer.

  const collectionPublicKey = "CFVFvkLDFhMufFMmZTioQDCMuba4rx4Ytjd9eq1jWyPR";
  const collection = await fetchCollection(umi, collectionPublicKey);

  const asset = generateSigner(umi);
  console.log(`Generated asset ${asset.publicKey.toString()}`);

  console.log(`Creating NFT...`);
  const tx = await create(umi, {
    asset,
    collection: collection,
    name: "My Nft Corgi X",
    uri: "https://gateway.irys.xyz/DKAXrdAJDPFDhx3LXFyFi6D7RoqNNNWPHjRDemniQnGc",
  }).sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Created NFT! Signature is ${signature}`);
};

run();
