import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { airdropIfRequired, getKeypairFromFile } from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
  const mintSecret = base58.deserialize(mint.secretKey)[0];
  console.log(`Generated asset ${mint.publicKey.toString()} with secret key ${mintSecret}`);

  // const SPL_TOKEN_2022_PROGRAM_ID = publicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

  console.log(`Creating NFT...`);
  const tx = await createNft(umi, {
    mint,
    name: "My Nft Corgi X",
    uri: "https://gateway.irys.xyz/DKAXrdAJDPFDhx3LXFyFi6D7RoqNNNWPHjRDemniQnGc",
    sellerFeeBasisPoints: percentAmount(5.5),
    // splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    collection: {
      key: publicKey("9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62"),
      verified: false,
    },
  }).sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Created NFT! Signature is ${signature}`);
};

run();

// Generated asset FStmb6VqaJDDSUknpSfGDZGcHRapH1dxPKoVd1sgbH7y with secret key 4A6UGAwg5YFXqPRzkv2HYBDQbQAbucLDy8wZ27eHbFZ9MG5As51VD7CrhqgA6Dg497qyZoP7XEscHGVDQ7wio9F9
// Creating NFT...
// 🖼️ Created NFT! Signature is 55ukzX8UVzkyV4gAFkF4veXRthjQMhRY2gHKcts975gep1wkemWW8S77wQbJkSmyLXzb3oThDvD3vhC9qHjKgAQF
