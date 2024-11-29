import { AnchorWallet } from "@solana/wallet-adapter-react"
import { AccountMeta, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  toMetaplexFile,
  PublicKey as MetaplexPublicKey,
  Pda,
} from "@metaplex-foundation/js"
import {
  DataV2,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs
} from "@metaplex-foundation/mpl-token-metadata"
import { none, createNoopSigner, Instruction} from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import * as token from "@solana/spl-token"
import * as fs from "fs"

export const signAndSendTx = async (
  connection: Connection,
  tx: Transaction,
  wallet: AnchorWallet
) => {
  tx.recentBlockhash = (
    await connection.getLatestBlockhash("singleGossip")
  ).blockhash
  tx.feePayer = wallet.publicKey
  
  const signedTx = await wallet.signTransaction(tx)
  const rawTransaction = signedTx.serialize()
  const txSig = await connection.sendRawTransaction(rawTransaction)

  const latestBlockHash = await connection.getLatestBlockhash()

  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSig,
  })

  return txSig
}

export const createNewMint = async (
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey,
  decimals: number
): Promise<PublicKey> => {

  const tokenMint = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals
  );

  console.log(`代币铸造账户地址为 ${tokenMint}`)
  console.log(
      `Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
  );

  return tokenMint;
}

const createTokenAccount = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
) => {
  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  )

  console.log(
      `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  )

  return tokenAccount
}

const mintTokens = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number
) => {
  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  )

  console.log(
    `铸币交易链接：https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

export const createTokenMetadata = async (
  connection: Connection,
  metaplex: Metaplex,
  mint: PublicKey,
  user: Keypair,
  name: string,
  symbol: string,
  description: string
) =>{
  // file to buffer
  const buffer = fs.readFileSync("assets/1203.png")

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, "1203.png")

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: name,
      description: description,
      image: imageUri,
    })

  console.log("metadata uri:", uri)

  // get metadata account address
  const metadataPDA = metaplex.nfts().pdas().metadata({ mint })

  // onchain metadata format
  const tokenMetadata : DataV2 = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: none(),
    collection: none(),
    uses: none()
  }

  const umi = createUmi(connection.rpcEndpoint)

  const metadataAccounts : CreateMetadataAccountV3InstructionAccounts = {
    metadata: fromWeb3JsPublicKey(metadataPDA),
    mint: fromWeb3JsPublicKey(mint),
    mintAuthority: createNoopSigner(fromWeb3JsPublicKey(user.publicKey)),
    payer: createNoopSigner(fromWeb3JsPublicKey(user.publicKey)),
    updateAuthority: fromWeb3JsPublicKey(user.publicKey),
  }
  const instructionArgs : CreateMetadataAccountV3InstructionDataArgs = {
    data: tokenMetadata,
    isMutable: true,
    collectionDetails: null
  }

  const createMetadataAccountV3Ix = createMetadataAccountV3(umi, {
   ...metadataAccounts,...instructionArgs
  }).getInstructions()

  const ix: Instruction = createMetadataAccountV3Ix[0];

  const ix_web : TransactionInstruction = {
    programId: toWeb3JsPublicKey(ix.programId),
    data: Buffer.from(ix.data),
    keys: ix.keys.map(key => {
        const newKey : AccountMeta = {
          ...key,
          pubkey: toWeb3JsPublicKey(key.pubkey),
        };
        return newKey;
    }),
  }

  const tx = new Transaction().add(ix_web);

  return tx;
}