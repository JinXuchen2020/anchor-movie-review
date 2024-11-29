import * as anchor from "@coral-xyz/anchor";

import { AnchorMovieReview } from "../target/types/anchor_movie_review";  // Adjust the path as necessary
import assert from "assert";
import { randomInt } from "crypto";
import { Metaplex } from "@metaplex-foundation/js";
import { createMint, getMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID as METADATA_PROGRAM_ID, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"

describe("Movie review Tests",    () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorMovieReview;// as anchor.Program<AnchorMovieReview>;
  const wallet = provider.wallet as anchor.Wallet;

  const reviewData ={
    title: "The Godfather",
    description: "A great movie",
    rating: 5,
  }

  const commentData = {
    comment: "Amazing movie!"
  }

  const rewardTokenData = {
    name: "Reward Token",
    symbol: "RT",
    uri: "https://example.com/reward-token-image.png"
  }

  let [movieAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("movie_review"), Buffer.from(reviewData.title),  wallet.publicKey.toBuffer()],
    program.programId
  );  

  console.log(`Movie Address: ${movieAccount.toBase58()}!`);

  it("create a reward token", async () => {
    let [rewardTokenAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    const metadataAddress = anchor.web3.Keypair.generate().publicKey;
    
    // const metaplex = new Metaplex(program.provider.connection)
    // const { metadataAddress } = await metaplex
    // .nfts()
    // .create({ 
    //   name: rewardTokenData.name,
    //   symbol: rewardTokenData.symbol,
    //   uri: rewardTokenData.uri,
    //   sellerFeeBasisPoints: 0,
    //  })
    await program.methods
      .createTokenReward(rewardTokenData.uri, rewardTokenData.name, rewardTokenData.symbol)
      .accounts({
        rewardMint: rewardTokenAccount,
        authority: wallet.publicKey,
        metadata: metadataAddress,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
      })  // If the movieAccount is a PDA, you don't need to sign with it. If it's a regular account, you need to sign with it. In this case, it's a regular account.
      .rpc();
    const result = await program.account.movieAccount.fetch(rewardTokenAccount);
    assert.ok(result.title === "The Godfather");
    console.log("Movie initialized successfully!");
  });

  it("initializes a movie on program", async () => {
    const [movieAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("movie_review"), Buffer.from(reviewData.title),  wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log(`Movie Address: ${movieAccount.toBase58()}!`);

    const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"),  movieAccount.toBuffer()],
      program.programId
    );

    console.log(`Movie Address: ${counterPDA.toBase58()}!`);
    const [mintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    console.log(`Movie Address: ${mintPDA.toBase58()}!`);

    const tokenAccount = await getAssociatedTokenAddress(mintPDA, wallet.publicKey);   

    console.log(`Movie Address: ${tokenAccount.toBase58()}!`);

    // try {
      await program.methods
      .initialize(reviewData.title, reviewData.title, reviewData.rating)
      .accounts({
        movieAccount: movieAccount,
        rewardMint: mintPDA,
        movieCommentCounter: counterPDA,
        user: wallet.publicKey,
        tokenAccount: tokenAccount
      })
      .rpc();
      const result = await program.account.movieAccount.fetch(movieAccount);
      assert.ok(result.title === "The Godfather");
      console.log("Movie initialized successfully!");
    // }
    // catch {
    //   const result = await program.account.movieAccount.fetch(movieAccount);
    //   assert.ok(result.title === "The Godfather");
    //   console.log("Movie initialized successfully!");
    // }
  });

  it("Review a movie", async () => {
    let [movieAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("movie_review"), Buffer.from(reviewData.title),  wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log(`Movie Address: ${movieAccount.toBase58()}!`);

    const preResult = await program.account.movieAccount.fetch(movieAccount);
    console.log(`${JSON.stringify(preResult)}`);
    const newRating = randomInt(1, 5);    
    await program.methods
      .addMovieReview(reviewData.title, newRating)
      .accounts({  // This is the title of the movie that we are reviewing. It should match the title of the movie that we initialized in the previous test. 
        movieAccount: movieAccount,
        user: wallet.publicKey
      })  // If the movieAccount is a PDA, you don't need to sign with it. If it's a regular account, you need to sign with it. In this case, it's a regular account.
      .rpc();  // This sends the transaction to the blockchain

    const result = await program.account.movieAccount.fetch(movieAccount);
    console.log(`${JSON.stringify(result)}`);
    assert.ok(result.reviewCount === preResult.reviewCount + 1);
    const newAverageRating = Math.round((preResult.rating * preResult.reviewCount + newRating)/result.reviewCount);  // This is the new average rating of the movie
    console.log(`${newAverageRating}`);
    assert.ok(result.rating === newAverageRating);
    console.log("Movie initialized successfully!");
  });

  it("Close a movie review", async () => {
    let [movieAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("movie_review"), Buffer.from(reviewData.title),  wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log(`Movie Address: ${movieAccount.toBase58()}!`);

    const preResult = await program.account.movieAccount.fetch(movieAccount);
    console.log(`${JSON.stringify(preResult)}`);
    const newRating = randomInt(1, 5);
    await program.methods
      .closeMovieReview()
      .accounts({ 
        movieAccount: movieAccount,
        reviewer: wallet.publicKey
      })
      .rpc();

    const result = await program.account.movieAccount.fetch(movieAccount);
    console.log(`${JSON.stringify(result)}`);
    assert.ok(result.reviewCount === preResult.reviewCount + 1);
    const newAverageRating = Math.round((preResult.rating * preResult.reviewCount + newRating)/result.reviewCount);  // This is the new average rating of the movie
    console.log(`${newAverageRating}`);
    assert.ok(result.rating === newAverageRating);
    console.log("Movie initialized successfully!");
  });
     
});