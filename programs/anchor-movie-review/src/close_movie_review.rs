use anchor_lang::prelude::*;

use crate::MovieReview;

#[derive(Accounts)]
pub struct CloseMovieReview<'info> {
  #[account(mut, close = reviewer, has_one = reviewer)]
  pub movie_account: Account<'info, MovieReview>,
  #[account(mut)]
  pub reviewer: Signer<'info>,
}

impl CloseMovieReview<'_> {
  pub fn close_review(ctx: Context<CloseMovieReview>) -> Result<()> {
    let movie_account = &mut ctx.accounts.movie_account;

    movie_account.close(ctx.accounts.reviewer.to_account_info())?;

    Ok(())
  }
}