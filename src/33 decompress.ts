import {
  decompressV1,
  findLeafAssetIdPda,
  findVoucherPda,
  getAssetWithProof,
  mplBubblegum,
  parseLeafFromMintToCollectionV1Transaction,
  redeem,
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
  const mintSignature = base58.serialize(
    "iV5vLwtwu4pmcnyAnmyV7pME3HaUzEHjtyzAJ2XDxCpWbrFYR2S9Qca3M1Xri5LfvNp2kc2cWorEqCByQ8pyKWV"
  );
  const leaf = await parseLeafFromMintToCollectionV1Transaction(umi, mintSignature);
  const assetId = findLeafAssetIdPda(umi, { merkleTree, leafIndex: leaf.nonce });
  console.log(`🍃 Created Leaf! AssetId is ${assetId.toString()}`);

  const assetWithProof = await getAssetWithProof(umi, publicKey(assetId));

  const redeemTx = await redeem(umi, {
    ...assetWithProof,
    leafOwner: signer,
  }).sendAndConfirm(umi);
  const redeemSignature = base58.deserialize(redeemTx.signature)[0];
  console.log(`🎉 Redeemed Nft! Signature is ${redeemSignature}`);

  const decompressTx = await decompressV1(umi, {
    ...assetWithProof,
    leafOwner: signer,
    mint: assetId,
    voucher: findVoucherPda(umi, assetWithProof),
  }).sendAndConfirm(umi);
  const decompressSignature = base58.deserialize(decompressTx.signature)[0];
  console.log(`🎉 Decompressed Nft! Signature is ${decompressSignature}`);
};

run();
