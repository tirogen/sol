import { createGenericFile, generateSigner, signerIdentity, sol } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const umi = createUmi(connection.rpcEndpoint).use(irysUploader({ address: "https://devnet.irys.xyz" }));

  const signer = generateSigner(umi);
  umi.use(signerIdentity(signer));

  console.log("Airdropping 1 SOL to identity");
  await umi.rpc.airdrop(umi.identity.publicKey, sol(1));

  const imageFile = fs.readFileSync("./assets/corgi.webp");

  // Use `createGenericFile` to transform the file into a `GenericFile` type
  // that umi can understand. Make sure you set the mimi tag type correctly
  // otherwise Arweave will not know how to display your image.

  const umiImageFile = createGenericFile(imageFile, "corgi.webp", {
    tags: [{ name: "Content-Type", value: "image/webp" }],
  });

  // Here we upload the image to Arweave via Irys and we get returned a uri
  // address where the file is located. You can log this out but as the
  // uploader can takes an array of files it also returns an array of uris.
  // To get the uri we want we can call index [0] in the array.

  const imageUri = await umi.uploader.upload([umiImageFile]);
  console.log("Image uploaded to Arweave at", imageUri[0]);

  const metadata = {
    name: "My Nft Corgi",
    description: "This is an Corgi Nft on Solana",
    image: imageUri[0],
    external_url: "https://example.com",
    attributes: [
      { trait_type: "animal", value: "dog" },
      { trait_type: "color", value: "brown" },
    ],
    properties: {
      files: [{ uri: imageUri[0], type: "image/webp" }],
      category: "image",
    },
  };

  // Call upon umi's uploadJson function to upload our metadata to Arweave via Irys.
  console.log("Uploading metadata...");
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("Metadata uploaded to Arweave at", metadataUri);
};
run();
