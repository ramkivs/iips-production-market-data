/** Browser-safe v1 restoration vocabulary. Authority is resolved by IPD, never supplied here. */
export interface PortfolioRestoreRequest {
  readonly portfolioId?: 'DEFAULT_PORTFOLIO';
  /** Tombstone's last-active pointer (not the DELETE revision). */
  readonly expectedRevision: number;
  readonly idempotencyKey: string;
}

/** Exact retries return this original receipt without another revision/event. */
export interface PortfolioRestoreReceipt {
  readonly portfolioId: string;
  readonly revision: number;
  readonly restoredAt: string;
  readonly isSaved: boolean;
}
export type PortfolioRestoreIpcOperation = 'portfolio.restore';
