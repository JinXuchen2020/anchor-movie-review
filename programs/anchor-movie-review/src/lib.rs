use anchor_lang::prelude::*;

mod add_movie_review;// Add this line to include the add_movie_review module
mod close_movie_review;
// mod create_token_reward;
mod add_review_comment;
use add_movie_review::*;
use close_movie_review::*;
use add_review_comment::*;
// use create_token_reward::*;

declare_id!("2sKBTPRKYR18wYTaTZLMXYdPywsnVKigXTtGEFemru6M");

#[program]
pub mod anchor_movie_review {
    use super::*;

    pub fn add_movie_review(ctx: Context<AddMoviewReview>, title: String, description: String, rating: u8) -> Result<()> {
      ctx.accounts.add_review(AddMoviewReviewBumps::from(ctx.bumps), title, description, rating)?;
      Ok(())
    }

    pub fn close_movie_review(ctx: Context<CloseMovieReview>) -> Result<()> {
      CloseMovieReview::close_review(ctx)?; // Call the function from the module
      Ok(())
    }

    pub fn add_review_comment(ctx: Context<AddReviewComment>, comment: String) -> Result<()> {
      ctx.accounts.add_comment(AddReviewCommentBumps::from(ctx.bumps), comment)?; // Call the function from the module
      Ok(())
    }

    // pub fn create_token_reward(ctx: Context<CreateTokenReward>, uri: String, name: String, symbol: String ) -> Result<()> {
    //   ctx.accounts.create_reward_mint(CreateTokenRewardBumps::from(ctx.bumps), uri, name, symbol)?; // Call the function from the module
    //   Ok(())
    // }
}
