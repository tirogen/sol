import { createNft, mplTokenMetadata, TokenStandard, transferV1 } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { airdropIfRequired, getKeypairFromFile } from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const user = await getKeypairFromFile("../keys/tkx.json");

  await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
  const kxKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  const kxSigner = createSignerFromKeypair(umi, kxKeypair);
  umi.use(signerIdentity(kxSigner));

  const testCreator = await getKeypairFromFile("../keys/tcre.json");
  const testCreatorKeypair = umi.eddsa.createKeypairFromSecretKey(testCreator.secretKey);
  const testCreatorSigner = createSignerFromKeypair(umi, testCreatorKeypair);

  const testUser = await getKeypairFromFile("../keys/tuse.json");
  const testKeypair = umi.eddsa.createKeypairFromSecretKey(testUser.secretKey);

  const mint = generateSigner(umi);
  const mintSecret = base58.deserialize(mint.secretKey)[0];
  console.log(`Generated asset ${mint.publicKey.toString()} with secret key ${mintSecret}`);

  // const SPL_TOKEN_2022_PROGRAM_ID = publicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

  let builder = transactionBuilder()
    .add(
      createNft(umi, {
        mint,
        name: "My Nft Corgi X",
        uri: "https://gateway.irys.xyz/DKAXrdAJDPFDhx3LXFyFi6D7RoqNNNWPHjRDemniQnGc",
        sellerFeeBasisPoints: percentAmount(5.5),
        collection: {
          key: publicKey("9DHFZ33wAnccwgiC55KZmCbhCuWXweqMMgXbTba1gS62"),
          verified: false,
        },
        tokenOwner: testCreatorSigner.publicKey,
      })
    )
    .add(
      transferV1(umi, {
        mint: mint.publicKey,
        authority: testCreatorSigner,
        tokenOwner: testCreatorSigner.publicKey,
        destinationOwner: testKeypair.publicKey,
        tokenStandard: TokenStandard.NonFungible,
      })
    );
  const signedTransaction = await builder.buildAndSign(umi);
  const signature = await umi.rpc.sendTransaction(signedTransaction);
  const hash = base58.deserialize(signature)[0];
  console.log(`🖼️ Created NFT! Signature is ${hash}`);
};

run();

// Generated asset 9gkRF6iHXcHXV3paHqFzSkTTWm6eTPLd5jStuhYdRVt4 with secret key 3EYMReUBqeCshZDEXxHM2Y7TeftriuQQdhFrJUwTYvRvBP9oyQ3o6T5NZkv7uyn9gZHF8LLGLSwE2XKEskWG3Q3J
// 🖼️ Created NFT! Signature is 652848xnKKpXkarrTtPq5TihbrSUUaw8sDA5Tas8Jxm6j34wcoktbzuz6ZJqLMhi66bnH4ovT4Gf78ZHDAy737Ay
