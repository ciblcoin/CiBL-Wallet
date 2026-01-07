use anchor_lang::prelude::*;
declare_id!("YOUR_PROGRAM_ID_WILL_BE_SET_HERE_AFTER_DEPLOYMENT");

#[program]
pub mod cibl_challenge {
    use super::*;

    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        amount: u64,
        asset_pair: String,
        duration_seconds: u64,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge_account;
        challenge.creator = ctx.accounts.creator.key();
        challenge.acceptor = None;
        challenge.amount = amount;
        challenge.asset_pair = asset_pair;
        challenge.status = 0; // 0 = Open, 1 = Active, 2 = Completed
        challenge.start_time = None;
        challenge.end_time = None;
        challenge.winner = None;
        Ok(())
    }

    pub fn accept_challenge(ctx: Context<AcceptChallenge>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge_account;
        
        require!(challenge.acceptor.is_none(), ErrorCode::ChallengeAlreadyAccepted);
        require!(challenge.creator != ctx.accounts.acceptor.key(), ErrorCode::UnauthorizedUser);
        
        challenge.acceptor = Some(ctx.accounts.acceptor.key());
        challenge.status = 1; // Set to Active
        challenge.start_time = Some(Clock::get()?.unix_timestamp);
        challenge.end_time = Some(Clock::get()?.unix_timestamp + 60); // 60 seconds from now
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(init, payer = creator, space = 8 + 32 + 32 + 8 + 50 + 1 + 16 + 16 + 16 + 16 + 32)]
    pub challenge_account: Account<'info, Challenge>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptChallenge<'info> {
    #[account(mut)]
    pub challenge_account: Account<'info, Challenge>,
    #[account(mut)]
    pub acceptor: Signer<'info>,
    /// CHECK: This is the creator of the challenge
    pub creator: AccountInfo<'info>,
}

#[account]
pub struct Challenge {
    pub creator: Pubkey,
    pub acceptor: Option<Pubkey>,
    pub amount: u64,
    pub asset_pair: String,
    pub status: u8, // 0: open, 1: active, 2: completed
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub creator_entry_price: Option<u64>,
    pub acceptor_entry_price: Option<u64>,
    pub winner: Option<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Challenge has already been accepted")]
    ChallengeAlreadyAccepted,
    #[msg("Challenge is not active")]
    ChallengeNotActive,
    #[msg("User not authorized for this action")]
    UnauthorizedUser,
}