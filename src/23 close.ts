import { burnV1, findMetadataPda, mplTokenMetadata, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";
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
  const ownerKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  const owner = createSignerFromKeypair(umi, ownerKeypair);
  umi.use(signerIdentity(owner));

  const builder = await burnV1(umi, {
    mint: publicKey("7Y6N3U6rPGuSeWACCXm7xR3yxhysZzXV22eGEtxYpqdt"), // edition and metadata will auto filled
    authority: owner,
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
    collectionMetadata: findMetadataPda(umi, { mint: publicKey("9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62") }),
  }).setFeePayer(owner);
  const tx = await builder.sendAndConfirm(umi);

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`🖼️ Closed NFT! Signature is ${signature}`);
};

run();
