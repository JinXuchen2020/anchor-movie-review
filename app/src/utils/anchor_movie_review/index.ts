import {type AnchorMovieReview } from '@/../../target/types/anchor_movie_review';

import * as IDL from '@/../../target/idl/anchor_movie_review.json';
import { IdlAccounts, ProgramAccount } from '@coral-xyz/anchor';

export { IDL, AnchorMovieReview };

export type IdlMovieReview = IdlAccounts<AnchorMovieReview>["movieReview"];
export type IdlMovieComment = IdlAccounts<AnchorMovieReview>["movieComment"];

export interface IdlMovieReviewWithComment extends ProgramAccount<IdlMovieReview> {
  comment?: ProgramAccount<IdlMovieComment>[];
  isShowComment?: boolean;
}