import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { airdropIfRequired, getKeypairFromFile } from "@solana-developers/helpers";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const user = await getKeypairFromFile("../keys/tkx.json");
  console.log("Loaded user", user.publicKey.toBase58());

  await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
  const keypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  const signer = createSignerFromKeypair(umi, keypair); // equivalent to using the `generateSigner`
  umi.use(signerIdentity(signer)); // Register a new keypair as the identity and payer.

  const mint = generateSigner(umi);
  console.log(`Generated asset ${mint.publicKey.toString()}`);

  console.log(`Creating Collection...`);
  const tx = await createNft(umi, {
    mint,
    name: "My Nft Corgi Collection",
    uri: "https://gateway.irys.xyz/DKAXrdAJDPFDhx3LXFyFi6D7RoqNNNWPHjRDemniQnGc",
    sellerFeeBasisPoints: percentAmount(5.5),
    isCollection: true,
  }).sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Created Collection! Signature is ${signature}`);
};

run();

// Generated asset 9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62
// Creating Collection...
// 🖼️ Created Collection! Signature is 2HwfCg6Ebize5ZM7d9QS2dKx3KLbue13TGMpXjAc9HApWhuNv4C1owmd2meWaKHAoLYnAJ7t3Rn2GRrgG6a2g9LQ
