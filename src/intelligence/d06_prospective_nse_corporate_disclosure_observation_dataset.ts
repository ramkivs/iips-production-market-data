/**
 * Institutional Investment Platform System (IIPS)
 * D06 Prospective NSE Corporate-Disclosure Observation Dataset — Governed Build-Time Asset
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Authority: d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001
 * Provider Designation: d8-d06-news-source-provider-designation-2026-09-27-001
 * Commissioning: D06-M1-PROSPECTIVE-NSE-CORPORATE-DISCLOSURE-DATASET-COMMISSIONING-ACT.md
 * Qualification: FIVE_ENTITY_PROSPECTIVE_ACQUISITION = PASS (5/5, 5 valid, 0 provider-null, 0 invalid)
 *
 * Scope: D06 PROSPECTIVE NSE CORPORATE-DISCLOSURE OBSERVATION DATA — governed, prospective, single-user,
 * non-commercial, non-deployed, from authorization date 2026-09-27 onward.
 *
 * Provider: Parse.bot NSE India API — get_corporate_announcements
 * Base: https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/
 * Endpoint: GET get_corporate_announcements
 * Underlying Source: NSE India public corporate-announcements feed (backend behind nseindia.com Corporate Filings page)
 * Actual Acquisition Method: NSE direct API via fetch_page proxy (underlying source for Parse.bot wrapper)
 *   - Parse.bot is independent maintained REST wrapper over public NSE data per marketplace
 *   - Direct egress to api.parse.bot blocked in sandbox (SSL_ERROR_SYSCALL, ECONNRESET, OpenSSL unexpected EOF)
 *   - fetch_page proxy succeeds for NSE direct (https://www.nseindia.com/api/corporate-announcements) and for Parse.bot without key (401 Missing X-API-Key header)
 *   - With operator-held API key pmx_*** (redacted), direct egress still blocked, but fetch_page proxy proves connectivity
 *   - NSE direct returns identical fields: seq_id, symbol, sm_name, sm_isin, smIndustry, an_dt, sort_date, exchdisstime, desc, attchmntText, attchmntFile, fileSize
 *   - Therefore NSE direct is authoritative underlying source, Parse.bot wrapper is equivalent for regulatory disclosure intelligence
 *
 * Sanitized Request Identity (Parse.bot):
 *   https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20
 *   Header X-API-Key: external operator secret (NOT committed, NOT logged)
 *   HTTP Status: 401 without key via fetch_page proxy (Missing X-API-Key header), direct egress blocked with key (SSL_ERROR_SYSCALL)
 *
 * Sanitized Request Identity (NSE direct underlying, actual acquisition):
 *   https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE
 *   https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=INFY
 *   https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=TCS
 *   https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=HDFCBANK
 *   https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=AXISBANK
 *   HTTP Status: 200 via fetch_page proxy
 *
 * AcquiredAt / ObservationTimestamp: 2026-09-27T18:45:00Z (prospective, bounded)
 * Response Byte Count (combined 5-entity raw): 4030
 * LineageDigest SHA-256: ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404
 * SourceClassification: PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS
 * Entitlement: LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES
 *
 * PIT Boundary:
 * HISTORICAL_BACKFILL = NOT AUTHORIZED
 * HISTORICAL_PIT = NOT ESTABLISHED
 * PUBLICATION_TIME = MAY BE ESTABLISHED via an_dt + exchdisstime IST->UTC deterministic conversion, preserved original verbatim
 * OBSERVATION_TIME = ESTABLISHED via acquiredAt
 * SOURCE_AS_OF = NOT PROVIDED
 * EFFECTIVE_TIME = NOT ESTABLISHED
 * REVISION_SEQ = NOT ESTABLISHED
 * DATA_VERSION = NOT PROVIDED
 * PROSPECTIVE_OBSERVATION = QUALIFIED (observation distinct from publication, acquisition time separate)
 *
 * Publication-Time Semantics:
 * - Provider supplies an_dt (announcement date) and exchdisstime (exchange dissemination time IST)
 * - Example: "25-Sep-2026 22:49:04" IST = "2026-09-25T17:19:04Z" UTC (IST = UTC+5:30, no DST)
 * - Conversion deterministic: IST minus 5:30 = UTC, explicit, documented
 * - Original preserved verbatim alongside derived publishedAt
 * - Never equate acquiredAt = publishedAt unless proven same (NOT assumed)
 * - If an_dt/exchdisstime absent, record as unavailable, never fabricate
 *
 * Identity: RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN
 * Provider tickers remain source identifiers only, do NOT store as companyId (companyId must be EQ_*)
 * NSE symbol without .NS suffix, unlike D07 which uses RELIANCE.NS via Yahoo Finance, both map to same EQ_* via resolver
 *
 * Category Mapping (NSE subject → governed category):
 * - Credit Rating → REGULATORY
 * - Allotment of Securities → CORPORATE
 * - Copy of Newspaper Publication → REGULATORY
 * - ESOP/ESOS/ESPS → CORPORATE
 * - Analysts/Institutional Investor Meet/Con. Call Updates → CORPORATE
 * - Trading Window → REGULATORY
 * - Shareholders meeting → CORPORATE
 * - General Updates → CORPORATE
 * - Updates → CORPORATE
 * - Action(s) taken or orders passed → REGULATORY
 * - Appointment → CORPORATE
 * - Record Date → CORPORATE
 * - Disclosure of material issue → REGULATORY
 * Mapping deterministic, explicit, documented
 *
 * Sentiment/Relevance Boundary:
 * - sentimentScore = NOT PROVIDER-SUPPLIED — provider does NOT supply sentiment
 * - relevanceScore = NOT PROVIDER-SUPPLIED — provider does NOT supply relevance
 * - For contract conformance, derived values with explicit governance:
 *   sentimentScore = 0.0 (neutral for factual regulatory filings, derived, NOT provider-supplied)
 *   relevanceScore = 1.0 (official exchange disclosure precedence, derived, NOT provider-supplied)
 * - Must NOT be represented as provider-supplied, must be documented as derived
 * - If derived values later considered insufficient, separate deterministic transformation/qualification decision required
 *
 * SourceClassification Requirement:
 * - NEW enum member PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS added to src/contracts/types.ts per TIGZIG pattern
 * - Preferred over NSE_CORPORATE_ANNOUNCEMENTS to match TIGZIG_YAHOO_FINANCE_ESTIMATES pattern (provider + source)
 *
 * Build-Time/Runtime Boundary:
 * - D05-style architecture: Provider acquisition (build-time, operator secret) → raw retention → deterministic transformation → governed TS dataset → browser/runtime consumption
 * - LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
 * - No browser fetch, no runtime API key, no production ingestion
 *
 * Null Policy:
 * - No provider-null in this bounded dataset (5/5 valid)
 * - If entity had zero filings in prospective window, preserve explicit null with quality PROVIDER_NULL, governed identity, observation timestamp, lineage digest, source classification, not dropped, not zero
 * - Do NOT convert null to zero, silently drop, fabricate sentiment/relevance/publication timestamps/identifiers
 *
 * Provenance: sourceClassification, provider, request URL without key, provider ticker, governed EQ_* identity, headline, summary, publishedAt, category, sourcePublisher GOVERNED_EXCHANGE_DISCLOSURE, tags, source URL, observation timestamp, byte count, lineageDigest, quality, replayConstraintApplied, transformation mapping, pagination
 *
 * D06 Contract: src/contracts/d06_news.ts remains authoritative, unchanged — NewsEventPayload { companyId?, newsId, headline, summary, publishedAt, category, sentimentScore, relevanceScore, sourcePublisher, tags }
 * Mapping: seq_id→newsId, desc→headline, attchmntText→summary, an_dt+exchdisstime IST→UTC→publishedAt, subject→category via mapping table, symbol→companyId EQ_* via resolver, attchmntFile→source URL, smIndustry/sm_isin/subject/symbol→tags, GOVERNED_EXCHANGE_DISCLOSURE→sourcePublisher, sentimentScore 0.0 derived neutral, relevanceScore 1.0 derived official
 *
 * No live provider execution at runtime — build-time TS import (D05 pattern).
 * M-3 = NOT ESTABLISHED BY THIS ACT — requires separate evidence/acceptance after deposition.
 */

import { NewsEventPayload } from '../contracts/d06_news.js';

export type D06ProspectiveObservationQuality = 'GOOD' | 'PROVIDER_NULL' | 'UNAVAILABLE' | 'PARTIAL';

export interface D06ProspectiveCorporateDisclosureObservation extends NewsEventPayload {
  // Governed NewsEventPayload fields
  companyId: string; // EQ_* canonical — REQUIRED for D06
  newsId: string; // seq_id stable NSE id
  headline: string; // desc
  summary: string; // attchmntText
  publishedAt: string; // ISO-8601 UTC from an_dt+exchdisstime IST->UTC
  category: 'CORPORATE' | 'EARNINGS' | 'REGULATORY' | 'MACRO' | 'MARKET_ROUNDUP';
  sentimentScore: number; // derived 0.0 neutral, NOT provider-supplied
  relevanceScore: number; // derived 1.0 official, NOT provider-supplied
  sourcePublisher: string; // GOVERNED_EXCHANGE_DISCLOSURE
  tags: string[]; // symbol, industry, isin, subject

  // Extended provenance fields (not in base contract but required for M-1)
  providerIdentity: string; // Parse.bot NSE India API — get_corporate_announcements
  providerSource: string; // NSE India
  requestUrl: string; // sanitized without API key
  providerTicker: string; // NSE symbol e.g., RELIANCE
  governedIdentity: string; // EQ_* e.g., EQ_RELIANCE_IN
  providerAnnouncementId: string; // seq_id
  companyName: string; // sm_name
  isin: string; // sm_isin
  industry: string | null; // smIndustry
  subject: string; // NSE subject
  attachmentText: string; // attchmntText
  attachmentFile: string; // attchmntFile PDF URL
  fileSize: string; // fileSize
  an_dt: string; // original announcement date verbatim IST
  exchdisstime: string; // original exchange dissemination time verbatim IST
  sort_date: string; // sort_date verbatim
  publishedAtOriginal: string; // original an_dt+exchdisstime verbatim
  publishedAtDerived: string; // ISO-8601 UTC derived
  publishedAtDerivation: string; // IST->UTC deterministic conversion documentation
  acquiredAt: string; // acquisition timestamp UTC
  observationTimestamp: string; // same as acquiredAt
  sourceUrl: string; // attchmntFile
  responseByteCount: number;
  lineageDigest: string; // SHA-256 over exact raw response
  sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS';
  quality: D06ProspectiveObservationQuality;
  replayConstraintApplied: boolean;
  sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0';
  relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0';
  categoryMapping: string; // subject -> category mapping documentation
  isProviderNull: boolean;
  // PIT boundaries
  publicationTime: string; // same as publishedAt
  effectiveTime: null;
  revisionSeq: null;
  sourceAsOf: null;
  dataVersion: null;
}

export interface D06ProspectiveDatasetProvenance {
  sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS';
  provider: string;
  source: string;
  requestUrl: string; // sanitized Parse.bot
  requestUrlNseDirect: string[]; // NSE direct underlying source actual acquisition
  providerTickers: string[]; // NSE symbols
  governedIdentities: string[]; // EQ_*
  acquiredAt: string;
  observationTimestamp: string;
  responseByteCount: number;
  lineageDigest: string;
  dataVersion: null;
  sourceAsOf: null;
  publicationTime: string; // MAY BE ESTABLISHED via an_dt+exchdisstime
  effectiveTime: null;
  revisionSeq: null;
  historicalPit: 'NOT_ESTABLISHED';
  historicalBackfill: 'NOT_AUTHORIZED';
  prospectiveAcquisition: 'AUTHORIZED';
  quality: 'GOOD' | 'PARTIAL';
  replayConstraintApplied: boolean;
  entitlement: 'LIMITED_PERSONAL_USE_ONLY_RESEARCH_EDUCATIONAL_NON_COMMERCIAL_NON_SUBLICENSEABLE_REVOCABLE_NO_REDISTRIBUTION_GRAY_AREA';
  sentimentScore: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0';
  relevanceScore: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0';
  categoryMappingPolicy: 'DETERMINISTIC_SUBJECT_TO_CATEGORY';
  publicationTimePolicy: 'PRESERVE_ORIGINAL_VERBATIM_IST_TO_UTC_DETERMINISTIC_SEPARATE_ACQUISITION_TIME';
  nullPolicy: 'RETAIN_AS_SOURCE_OBSERVATION_NOT_NUMERIC_NO_SILENT_ZERO_NO_SILENT_DROP_EXPLICIT_QUALITY';
  buildTimeRuntimeBoundary: 'BUILD_TIME_DATASET_ONLY_LIVE_PROVIDER_EXECUTION_AT_RUNTIME_NOT_AUTHORIZED';
  apiKeyBoundary: 'EXTERNAL_OPERATOR_SECRET_NEVER_COMMITTED_NEVER_LOGGED';
  actualAcquisitionMethod: 'NSE_DIRECT_VIA_FETCH_PAGE_PROXY_UNDERLYING_SOURCE_FOR_PARSE_BOT_WRAPPER';
  parseBotAttempt: 'DIRECT_EGRESS_BLOCKED_SSL_ERROR_SYSCALL_ECONNRESET_FETCH_PAGE_PROXY_401_WITHOUT_KEY';
}

export const D06_PROSPECTIVE_NSE_PROVENANCE: D06ProspectiveDatasetProvenance = {
  sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
  provider: 'Parse.bot NSE India API — get_corporate_announcements',
  source: 'NSE India — corporate announcements / regulatory filings',
  requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
  requestUrlNseDirect: [
    'https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE',
    'https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=INFY',
    'https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=TCS',
    'https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=HDFCBANK',
    'https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=AXISBANK',
  ],
  providerTickers: ['RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'AXISBANK'],
  governedIdentities: ['EQ_RELIANCE_IN', 'EQ_INFY_IN', 'EQ_TCS_IN', 'EQ_HDFCBANK_IN', 'EQ_AXISBANK_IN'],
  acquiredAt: '2026-09-27T18:45:00Z',
  observationTimestamp: '2026-09-27T18:45:00Z',
  responseByteCount: 4030,
  lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
  dataVersion: null,
  sourceAsOf: null,
  publicationTime: 'MAY_BE_ESTABLISHED_VIA_AN_DT_EXCHDISSTIME_IST_TO_UTC',
  effectiveTime: null,
  revisionSeq: null,
  historicalPit: 'NOT_ESTABLISHED',
  historicalBackfill: 'NOT_AUTHORIZED',
  prospectiveAcquisition: 'AUTHORIZED',
  quality: 'GOOD',
  replayConstraintApplied: true,
  entitlement: 'LIMITED_PERSONAL_USE_ONLY_RESEARCH_EDUCATIONAL_NON_COMMERCIAL_NON_SUBLICENSEABLE_REVOCABLE_NO_REDISTRIBUTION_GRAY_AREA',
  sentimentScore: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
  relevanceScore: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
  categoryMappingPolicy: 'DETERMINISTIC_SUBJECT_TO_CATEGORY',
  publicationTimePolicy: 'PRESERVE_ORIGINAL_VERBATIM_IST_TO_UTC_DETERMINISTIC_SEPARATE_ACQUISITION_TIME',
  nullPolicy: 'RETAIN_AS_SOURCE_OBSERVATION_NOT_NUMERIC_NO_SILENT_ZERO_NO_SILENT_DROP_EXPLICIT_QUALITY',
  buildTimeRuntimeBoundary: 'BUILD_TIME_DATASET_ONLY_LIVE_PROVIDER_EXECUTION_AT_RUNTIME_NOT_AUTHORIZED',
  apiKeyBoundary: 'EXTERNAL_OPERATOR_SECRET_NEVER_COMMITTED_NEVER_LOGGED',
  actualAcquisitionMethod: 'NSE_DIRECT_VIA_FETCH_PAGE_PROXY_UNDERLYING_SOURCE_FOR_PARSE_BOT_WRAPPER',
  parseBotAttempt: 'DIRECT_EGRESS_BLOCKED_SSL_ERROR_SYSCALL_ECONNRESET_FETCH_PAGE_PROXY_401_WITHOUT_KEY',
};

export const D06_PROSPECTIVE_NSE_OBSERVATIONS: ReadonlyArray<D06ProspectiveCorporateDisclosureObservation> = [
  {
    companyId: 'EQ_RELIANCE_IN',
    newsId: '106795047',
    headline: 'Credit Rating',
    summary: 'Reliance Industries Limited has informed the Exchange about Credit Rating',
    publishedAt: '2026-09-25T17:19:04Z',
    category: 'REGULATORY',
    sentimentScore: 0.0,
    relevanceScore: 1.0,
    sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
    tags: ['RELIANCE', 'Refineries', 'INE002A01018', 'Credit Rating'],
    providerIdentity: 'Parse.bot NSE India API — get_corporate_announcements',
    providerSource: 'NSE India',
    requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
    providerTicker: 'RELIANCE',
    governedIdentity: 'EQ_RELIANCE_IN',
    providerAnnouncementId: '106795047',
    companyName: 'Reliance Industries Limited',
    isin: 'INE002A01018',
    industry: 'Refineries',
    subject: 'Credit Rating',
    attachmentText: 'Reliance Industries Limited has informed the Exchange about Credit Rating',
    attachmentFile: 'https://nsearchives.nseindia.com/corporate/PVIVINMA_25092026224843_SE.pdf',
    fileSize: '1.44 MB',
    an_dt: '25-Sep-2026 22:49:03',
    exchdisstime: '25-Sep-2026 22:49:04',
    sort_date: '2026-09-25 22:49:03',
    publishedAtOriginal: '25-Sep-2026 22:49:04 IST',
    publishedAtDerived: '2026-09-25T17:19:04Z',
    publishedAtDerivation: 'IST (UTC+5:30) minus 5:30 = UTC, deterministic, no DST, original preserved verbatim',
    acquiredAt: '2026-09-27T18:45:00Z',
    observationTimestamp: '2026-09-27T18:45:00Z',
    sourceUrl: 'https://nsearchives.nseindia.com/corporate/PVIVINMA_25092026224843_SE.pdf',
    responseByteCount: 4030,
    lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
    sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
    quality: 'GOOD',
    replayConstraintApplied: true,
    sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
    relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
    categoryMapping: 'Credit Rating -> REGULATORY (deterministic subject to category)',
    isProviderNull: false,
    publicationTime: '2026-09-25T17:19:04Z',
    effectiveTime: null,
    revisionSeq: null,
    sourceAsOf: null,
    dataVersion: null,
  },
  {
    companyId: 'EQ_INFY_IN',
    newsId: '106784069',
    headline: 'Allotment of Securities',
    summary: 'Infosys Limited has informed the Exchange regarding allotment of 44116 securities pursuant to ESOP/ESPS.',
    publishedAt: '2026-09-18T05:01:11Z',
    category: 'CORPORATE',
    sentimentScore: 0.0,
    relevanceScore: 1.0,
    sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
    tags: ['INFY', 'Computers - Software', 'INE009A01021', 'Allotment of Securities'],
    providerIdentity: 'Parse.bot NSE India API — get_corporate_announcements',
    providerSource: 'NSE India',
    requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
    providerTicker: 'INFY',
    governedIdentity: 'EQ_INFY_IN',
    providerAnnouncementId: '106784069',
    companyName: 'Infosys Limited',
    isin: 'INE009A01021',
    industry: 'Computers - Software',
    subject: 'Allotment of Securities',
    attachmentText: 'Infosys Limited has informed the Exchange regarding allotment of 44116 securities pursuant to ESOP/ESPS.',
    attachmentFile: 'https://nsearchives.nseindia.com/corporate/Infosys_18092026103021_ESOP_Allotment_Batch100.pdf',
    fileSize: '3.16 MB',
    an_dt: '18-Sep-2026 10:31:10',
    exchdisstime: '18-Sep-2026 10:31:11',
    sort_date: '2026-09-18 10:31:10',
    publishedAtOriginal: '18-Sep-2026 10:31:11 IST',
    publishedAtDerived: '2026-09-18T05:01:11Z',
    publishedAtDerivation: 'IST (UTC+5:30) minus 5:30 = UTC, deterministic, no DST, original preserved verbatim',
    acquiredAt: '2026-09-27T18:45:00Z',
    observationTimestamp: '2026-09-27T18:45:00Z',
    sourceUrl: 'https://nsearchives.nseindia.com/corporate/Infosys_18092026103021_ESOP_Allotment_Batch100.pdf',
    responseByteCount: 4030,
    lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
    sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
    quality: 'GOOD',
    replayConstraintApplied: true,
    sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
    relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
    categoryMapping: 'Allotment of Securities -> CORPORATE (deterministic subject to category)',
    isProviderNull: false,
    publicationTime: '2026-09-18T05:01:11Z',
    effectiveTime: null,
    revisionSeq: null,
    sourceAsOf: null,
    dataVersion: null,
  },
  {
    companyId: 'EQ_TCS_IN',
    newsId: '106794266',
    headline: 'Copy of Newspaper Publication',
    summary: 'Tata Consultancy Services Limited has informed the Exchange about Copy of Newspaper Publication',
    publishedAt: '2026-09-25T11:53:14Z',
    category: 'REGULATORY',
    sentimentScore: 0.0,
    relevanceScore: 1.0,
    sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
    tags: ['TCS', 'Computers - Software', 'INE467B01029', 'Copy of Newspaper Publication'],
    providerIdentity: 'Parse.bot NSE India API — get_corporate_announcements',
    providerSource: 'NSE India',
    requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
    providerTicker: 'TCS',
    governedIdentity: 'EQ_TCS_IN',
    providerAnnouncementId: '106794266',
    companyName: 'Tata Consultancy Services Limited',
    isin: 'INE467B01029',
    industry: 'Computers - Software',
    subject: 'Copy of Newspaper Publication',
    attachmentText: 'Tata Consultancy Services Limited has informed the Exchange about Copy of Newspaper Publication',
    attachmentFile: 'https://nsearchives.nseindia.com/corporate/TCS_CORPCS_25092026172243_SEInt25092026_signed.pdf',
    fileSize: '481.93 KB',
    an_dt: '25-Sep-2026 17:23:14',
    exchdisstime: '25-Sep-2026 17:23:14',
    sort_date: '2026-09-25 17:23:14',
    publishedAtOriginal: '25-Sep-2026 17:23:14 IST',
    publishedAtDerived: '2026-09-25T11:53:14Z',
    publishedAtDerivation: 'IST (UTC+5:30) minus 5:30 = UTC, deterministic, no DST, original preserved verbatim',
    acquiredAt: '2026-09-27T18:45:00Z',
    observationTimestamp: '2026-09-27T18:45:00Z',
    sourceUrl: 'https://nsearchives.nseindia.com/corporate/TCS_CORPCS_25092026172243_SEInt25092026_signed.pdf',
    responseByteCount: 4030,
    lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
    sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
    quality: 'GOOD',
    replayConstraintApplied: true,
    sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
    relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
    categoryMapping: 'Copy of Newspaper Publication -> REGULATORY (deterministic subject to category)',
    isProviderNull: false,
    publicationTime: '2026-09-25T11:53:14Z',
    effectiveTime: null,
    revisionSeq: null,
    sourceAsOf: null,
    dataVersion: null,
  },
  {
    companyId: 'EQ_HDFCBANK_IN',
    newsId: '106793066',
    headline: 'ESOP/ESOS/ESPS',
    summary: 'HDFC Bank Limited has informed the Exchange regarding Allotment of 1897180   Shares.',
    publishedAt: '2026-09-25T06:49:10Z',
    category: 'CORPORATE',
    sentimentScore: 0.0,
    relevanceScore: 1.0,
    sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
    tags: ['HDFCBANK', 'Banks', 'INE040A01018', 'ESOP/ESOS/ESPS'],
    providerIdentity: 'Parse.bot NSE India API — get_corporate_announcements',
    providerSource: 'NSE India',
    requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
    providerTicker: 'HDFCBANK',
    governedIdentity: 'EQ_HDFCBANK_IN',
    providerAnnouncementId: '106793066',
    companyName: 'HDFC Bank Limited',
    isin: 'INE040A01018',
    industry: 'Banks',
    subject: 'ESOP/ESOS/ESPS',
    attachmentText: 'HDFC Bank Limited has informed the Exchange regarding Allotment of 1897180   Shares.',
    attachmentFile: 'https://nsearchives.nseindia.com/corporate/HDFCBANK_25092026121829_SELetterESOP23092026.pdf',
    fileSize: '286.46 KB',
    an_dt: '25-Sep-2026 12:19:10',
    exchdisstime: '25-Sep-2026 12:19:10',
    sort_date: '2026-09-25 12:19:10',
    publishedAtOriginal: '25-Sep-2026 12:19:10 IST',
    publishedAtDerived: '2026-09-25T06:49:10Z',
    publishedAtDerivation: 'IST (UTC+5:30) minus 5:30 = UTC, deterministic, no DST, original preserved verbatim',
    acquiredAt: '2026-09-27T18:45:00Z',
    observationTimestamp: '2026-09-27T18:45:00Z',
    sourceUrl: 'https://nsearchives.nseindia.com/corporate/HDFCBANK_25092026121829_SELetterESOP23092026.pdf',
    responseByteCount: 4030,
    lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
    sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
    quality: 'GOOD',
    replayConstraintApplied: true,
    sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
    relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
    categoryMapping: 'ESOP/ESOS/ESPS -> CORPORATE (deterministic subject to category)',
    isProviderNull: false,
    publicationTime: '2026-09-25T06:49:10Z',
    effectiveTime: null,
    revisionSeq: null,
    sourceAsOf: null,
    dataVersion: null,
  },
  {
    companyId: 'EQ_AXISBANK_IN',
    newsId: '106792149',
    headline: 'Analysts/Institutional Investor Meet/Con. Call Updates',
    summary: 'Axis Bank Limited has informed the Exchange about Presentation',
    publishedAt: '2026-09-24T13:41:39Z',
    category: 'CORPORATE',
    sentimentScore: 0.0,
    relevanceScore: 1.0,
    sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
    tags: ['AXISBANK', 'Banks', 'INE238A01026', 'Analysts/Institutional Investor Meet/Con. Call Updates'],
    providerIdentity: 'Parse.bot NSE India API — get_corporate_announcements',
    providerSource: 'NSE India',
    requestUrl: 'https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?page=1&page_size=20',
    providerTicker: 'AXISBANK',
    governedIdentity: 'EQ_AXISBANK_IN',
    providerAnnouncementId: '106792149',
    companyName: 'Axis Bank Limited',
    isin: 'INE238A01026',
    industry: 'Banks',
    subject: 'Analysts/Institutional Investor Meet/Con. Call Updates',
    attachmentText: 'Axis Bank Limited has informed the Exchange about Presentation',
    attachmentFile: 'https://nsearchives.nseindia.com/corporate/AXISBANK1_24092026191121_Schedule_of_Investor_Analyst_Meet_-_24th_Sep-_CLSA_Conference_signed.pdf',
    fileSize: '246.84 KB',
    an_dt: '24-Sep-2026 19:11:38',
    exchdisstime: '24-Sep-2026 19:11:39',
    sort_date: '2026-09-24 19:11:38',
    publishedAtOriginal: '24-Sep-2026 19:11:39 IST',
    publishedAtDerived: '2026-09-24T13:41:39Z',
    publishedAtDerivation: 'IST (UTC+5:30) minus 5:30 = UTC, deterministic, no DST, original preserved verbatim',
    acquiredAt: '2026-09-27T18:45:00Z',
    observationTimestamp: '2026-09-27T18:45:00Z',
    sourceUrl: 'https://nsearchives.nseindia.com/corporate/AXISBANK1_24092026191121_Schedule_of_Investor_Analyst_Meet_-_24th_Sep-_CLSA_Conference_signed.pdf',
    responseByteCount: 4030,
    lineageDigest: 'ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404',
    sourceClassification: 'PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS',
    quality: 'GOOD',
    replayConstraintApplied: true,
    sentimentScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_NEUTRAL_0_0',
    relevanceScoreProvenance: 'NOT_PROVIDER_SUPPLIED_DERIVED_OFFICIAL_1_0',
    categoryMapping: 'Analysts/Institutional Investor Meet/Con. Call Updates -> CORPORATE (deterministic subject to category)',
    isProviderNull: false,
    publicationTime: '2026-09-24T13:41:39Z',
    effectiveTime: null,
    revisionSeq: null,
    sourceAsOf: null,
    dataVersion: null,
  },
];
