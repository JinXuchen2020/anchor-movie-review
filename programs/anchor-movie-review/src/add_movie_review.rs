use anchor_lang::prelude::*;
// use anchor_spl::{associated_token::AssociatedToken, token::{self, Mint, Token, TokenAccount}};

#[derive(Accounts)]
#[instruction(title: String)]
pub struct AddMoviewReview<'info> {
  #[account(init_if_needed, 
    payer = reviewer, 
    space = MovieReview::LEN,
    seeds = [b"movie_review", title.as_bytes(), reviewer.key().as_ref()], 
    bump
  )]
  pub movie_review: Account<'info, MovieReview>,
  #[account(mut)]
  pub reviewer: Signer<'info>,

  // create movie_comment_counter account
  #[account(
    init,
    seeds = ["counter".as_bytes(), movie_review.key().as_ref()],
    bump,
    payer = reviewer,
    space = 8 + 8
  )]
  pub review_comment_counter: Account<'info, ReviewCommentCounter>,

  // // Related to created reward token in create_token_reward.rs
  // #[account(mut,
  //   seeds = ["mint".as_bytes()],
  //   bump
  // )]
  // pub reward_mint: Account<'info, Mint>,

  // // create associated token account for reward token 
  // #[account(
  //   init_if_needed,
  //   payer = user,
  //   associated_token::mint = reward_mint,
  //   associated_token::authority = user
  // )]
  // pub token_account: Account<'info, TokenAccount>,

  // pub token_program: Program<'info, Token>,
  // pub associated_token_program: Program<'info, AssociatedToken>,
  // pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
}

#[account]
pub struct MovieReview {
  pub reviewer: Pubkey,
  pub title: String,
  pub description: String,
  pub rating: u8
}

#[account]
pub struct ReviewCommentCounter {
  pub counter: u8,
}

impl MovieReview {
    const DESC_MAX_LEN: usize = 1024;
    const TITLE_MAX_LEN: usize = 32;
    const DISCRIMINATOR_LENGTH: usize = 8;
    pub const LEN: usize = Self::DISCRIMINATOR_LENGTH
        + std::mem::size_of::<Pubkey>()
        + Self::TITLE_MAX_LEN
        + Self::DESC_MAX_LEN
        + 8;
}

#[allow(warnings)]
impl<'info> AddMoviewReview<'info> {
    pub fn add_review(
        self: &mut Self,
        bumps: AddMoviewReviewBumps,
        title: String,
        description: String,
        rating: u8,
    ) -> Result<()> {
        if title.chars().count() > MovieReview::TITLE_MAX_LEN {
            return Err(ErrorCode::TitleTooLong.into());
        }
        if description.chars().count() > MovieReview::DESC_MAX_LEN {
            return Err(ErrorCode::DescriptionTooLong.into());
        }
        if rating > 5 || rating < 1 {
            return Err(ErrorCode::RatingTooHigh.into());
        }

        let movie_account = &mut self.movie_review;
        movie_account.reviewer = self.reviewer.key();
        movie_account.title = title;
        movie_account.description = description;
        movie_account.rating = rating;

        msg!("创建了影评计数器账户");
        let movie_comment_counter = &mut self.review_comment_counter;
        movie_comment_counter.counter = 0;
        msg!("计数器：{}", movie_comment_counter.counter);

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

#[error_code]
pub enum ErrorCode {
  #[msg("The provided title should be 32 characters long maximum.")] 
  TitleTooLong, 
  #[msg("The provided description should be 1024 characters long maximum.")] 
  DescriptionTooLong, 
  #[msg("The rating should be between 1 and 5.")] 
  RatingTooHigh,
}