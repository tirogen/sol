import { airdropIfRequired, getKeypairFromFile, makeKeypairs } from "@solana-developers/helpers";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  NonceAccount,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const run = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const user = await getKeypairFromFile("../keys/tkx.json");
  console.log("Loaded user", user.publicKey.toBase58());

  await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

  const signer = Keypair.fromSecretKey(user.secretKey);
  const [nonceSigner] = makeKeypairs(1);
  const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH);
  // 2. Assemble and submit a transaction that will:
  const tx = new Transaction().add(
    // 2.1. Allocate the account that will be the nonce account.
    SystemProgram.createAccount({
      fromPubkey: signer.publicKey,
      newAccountPubkey: nonceSigner.publicKey,
      lamports: rentExemptBalance,
      space: NONCE_ACCOUNT_LENGTH,
      programId: SystemProgram.programId,
    }),
    // 2.2. Initialize the nonce account using the `SystemProgram.nonceInitialize` instruction.
    SystemProgram.nonceInitialize({
      noncePubkey: nonceSigner.publicKey,
      authorizedPubkey: signer.publicKey,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [signer, nonceSigner]);
  console.log(`Nonce create at ${nonceSigner.publicKey} with signature ${sig}`);

  // 3. Fetch the nonce account.
  const accountInfo = await connection.getAccountInfo(nonceSigner.publicKey);
  if (!accountInfo) {
    throw new Error("Nonce account not found");
  }
  // 4. Serialize the nonce account data and return it.
  const nonceData = NonceAccount.fromAccountData(accountInfo.data);
  console.log("Nonce account data:", nonceData);
};

run();

// Nonce create at G3kmU4nZ4EBRCQJbGMV4gGZ3Rvuq8evWq3LavSBcNscj with signature MuQMHeA6yWoeQVFmLZP8Cij2BenhsvW4hX6NYmfayYnAvL3rtZ9ydP32qC9VJgfa5ysAPgmQJaEHSiuz9aAVmHf
// Nonce account data: NonceAccount {
//   authorizedPubkey: PublicKey [PublicKey(tkxWCBPMGdRximWsuDfCnssywMNLKmVBQdbpQ9pmJry)] {
//     _bn: <BN: d4252d41b63514d632e16923a26ee3e4a13bc394f7679a243fdf6db9a0e2fc6>
//   },
//   nonce: '5ZUffTDL4DyRRcxVDXBY8uVoMfpY4uiN61fSUb1wjgab',
//   feeCalculator: { lamportsPerSignature: 5000 }
// }
