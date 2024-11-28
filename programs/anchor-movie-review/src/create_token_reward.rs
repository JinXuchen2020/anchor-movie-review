use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{metadata::mpl_token_metadata::{instructions::{CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs}, types::DataV2}, token::{Mint, Token}};

#[derive(Accounts)]
pub struct CreateTokenReward<'info> {
  #[account(mut)]
  pub authority: Signer<'info>,

  #[account(
    init, 
    payer = authority, 
    mint::decimals = 0,
    mint::authority = reward_mint,
    seeds = [b"mint".as_ref()],
    bump
  )]
  pub reward_mint: Account<'info, Mint>,

  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,

  /// CHECK:
  #[account(mut)]
  pub metadata: AccountInfo<'info>,
  /// CHECK:
  pub token_metadata_program: AccountInfo<'info>,
}

impl CreateTokenReward<'_> {
    pub fn create_reward_mint(
      &self, 
      bumps: CreateTokenRewardBumps, 
      uri: String,
      name: String,
      symbol: String,) -> Result<()> 
    {
      let seeds = [b"mint".as_ref(), &[bumps.reward_mint]];

      let signer = [&seeds[..]];

      let metadata_account = CreateMetadataAccountV3 {
        metadata: self.metadata.key(),
        mint: self.reward_mint.key(),
        mint_authority: self.reward_mint.key(),
        payer: self.authority.key(),
        update_authority: (self.authority.key(), true),
        system_program: self.system_program.key(),
        rent: Some(self.rent.key()),
      };

      let args = CreateMetadataAccountV3InstructionArgs {
        data: DataV2 {
          name,
          symbol,
          uri,
          seller_fee_basis_points: 0,
          creators: None,
          collection: None,
          uses: None,
        },
        is_mutable: true,
        collection_details: None        
      };

      let instruction = metadata_account.instruction(args);

      let account_infos = vec![
        self.metadata.to_account_info(),
        self.reward_mint.to_account_info(),
        self.authority.to_account_info(),
        self.token_metadata_program.to_account_info(),
        self.token_program.to_account_info(),
        self.system_program.to_account_info(),
        self.rent.to_account_info(),
      ];

      invoke_signed(&instruction, account_infos.as_slice(), &signer)?;

      Ok(())
    }
      
}