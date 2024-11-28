use anchor_lang::prelude::*;
// use anchor_spl::{associated_token::AssociatedToken, token::{self, Mint, Token, TokenAccount}};

use crate::{MovieReview, ReviewCommentCounter};

#[derive(Accounts)]
#[instruction(comment: String)]
pub struct AddReviewComment<'info> {
  #[account(
    init,
    seeds = [movie_review.key().as_ref(), &movie_comment_counter.counter.to_le_bytes()],
    bump,
    payer = commenter,
    space = 8 + 32 + 32 + 4 + comment.len() + 8
  )]
  pub movie_comment: Account<'info, MovieComment>,
  pub movie_review: Account<'info, MovieReview>,

  #[account(
    mut,
    seeds = ["counter".as_bytes(), movie_review.key().as_ref()],
    bump,
  )]
  pub movie_comment_counter: Account<'info, ReviewCommentCounter>,

  #[account(mut)]
  pub commenter: Signer<'info>,

  // #[account(mut,
  //   seeds = ["mint".as_bytes()],
  //   bump
  // )]
  // pub reward_mint: Account<'info, Mint>,
  
  // #[account(
  //     init_if_needed,
  //     payer = initializer,
  //     associated_token::mint = reward_mint,
  //     associated_token::authority = initializer
  // )]
  // pub token_account: Account<'info, TokenAccount>,
  // pub token_program: Program<'info, Token>,
  // pub associated_token_program: Program<'info, AssociatedToken>,
  // pub rent: Sysvar<'info, Rent>,

  pub system_program: Program<'info, System>,
}

#[account]
pub struct MovieComment {
  pub movie_review: Pubkey,
  pub commenter: Pubkey,
  pub comment: String,
  pub count: u8
}

#[allow(warnings)]
impl<'info> AddReviewComment<'info> {
  pub fn add_comment(
    &mut self, 
    bumps: AddReviewCommentBumps, 
    comment: String) -> Result<()> 
  {
    let comment_account = &mut self.movie_comment;
    let comment_counter = &mut self.movie_comment_counter;
    comment_account.movie_review = self.movie_review.key();
    comment_account.commenter = self.commenter.key();
    comment_account.comment = comment;
    comment_account.count = comment_counter.counter;

    comment_counter.counter += 1;

    // let seeds = &["mint".as_bytes(), &[bumps.reward_mint]];

    // let signer = [&seeds[..]];

    // let cpi_ctx = CpiContext::new_with_signer(
    //   self.token_program.to_account_info(),
    //     token::MintTo {
    //         mint: self.reward_mint.to_account_info(),
    //         to: self.token_account.to_account_info(),
    //         authority: self.reward_mint.to_account_info(),
    //     },
    //     &signer,
    // );

    // token::mint_to(cpi_ctx, 10000000)?;
    // msg!("已铸币");
    Ok(())
  }
}