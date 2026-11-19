import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';
import { parseTradingCalendar, type SessionFreshnessContext } from '../src/quality/trading_calendar.js';
import { DhanBoundedCache } from '../src/providers/dhan/dhan_operational_controls.js';
import { freshnessStatus } from '../src/providers/dhan/dhan_freshness_status.js';
import { normalizeDhanHistoricalToCandles } from '../src/providers/dhan/dhan_historical_adapter.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

const raw = JSON.parse(readFileSync('tests/fixtures/w22-calendar.json', 'utf8'));
const calendar = parseTradingCalendar(raw);
const quote: SessionFreshnessContext = {kind:'QUOTE',calendar,exchange:'NSE'};
const observation = '2026-11-13T09:59:00Z';
const evaluate = (time:string, timestamp=observation, context=quote) => evaluateFreshness(timestamp,'D01_QUOTES',time,context);
const daily = (time:string,exchange:'NSE'|'BSE'='NSE') => evaluateFreshness('2026-11-12T18:30:00Z','D02_OHLCV',time,{kind:'DAILY_CLOSE',calendar,exchange,observationDate:'2026-11-13',completed:true});

test('W22 after close, weekend, holiday, pre-open: observation ages only in covered open intervals', () => {
 for (const time of ['2026-11-13T15:00:00Z','2026-11-14T12:00:00Z','2026-11-15T12:00:00Z','2026-11-16T12:00:00Z','2026-11-17T03:44:59Z']) {
  const r=evaluate(time);assert.equal(r.ageSeconds,60);assert.equal(r.quality,'GOOD');assert.equal(r.sessionState,'CLOSED');
 }
});
test('W22 first session after holiday resumes ageing; active session has no clock-phase reset', () => {
 assert.equal(evaluate('2026-11-17T03:45:00Z').ageSeconds,60);
 for (const seconds of [1,60,600,840,841,1200,1740,1741]) {
  const t=new Date(Date.parse('2026-11-17T03:45:00Z')+seconds*1000).toISOString();
  const r=evaluate(t);assert.equal(r.ageSeconds,60+seconds);
  assert.equal(r.quality,seconds<=840?'GOOD':seconds<=1740?'STALE':'UNAVAILABLE');
  assert.equal(r.sessionState,'OPEN');assert.deepEqual(r,evaluate(t));
 }
});
test('W22 already-stale quotes do not become fresh at closure; active-session baseline thresholds stay intact',()=>{
 assert.equal(evaluate('2026-11-14T12:00:00Z','2026-11-13T09:40:00Z').quality,'STALE');
 const r=evaluate('2026-11-13T09:59:00Z','2026-11-13T09:39:00Z');assert.equal(r.ageSeconds,1200);assert.equal(r.nominalThresholdSeconds,900);
 assert.equal(evaluateFreshness('2026-11-13T09:39:00Z','D01_QUOTES','2026-11-13T09:59:00Z').quality,r.quality);
});
test('W22 missing, unknown, invalid calendar, wrong exchange, future/closed-date observations fail closed',()=>{
 for(const t of ['2026-11-25T10:00:00Z','2026-11-26T10:00:00Z'])assert.equal(evaluate(t).calendarIssue,'MISSING_COVERAGE');
 assert.equal(evaluate('2026-11-14T12:00:00Z','2026-11-14T09:59:00Z').calendarIssue,'INVALID_OBSERVATION');
 assert.equal(evaluate('2026-11-13T09:58:00Z').suppressExecution,true);
 assert.equal(evaluate('bad').quality,'UNAVAILABLE');
 assert.equal(evaluate('2026-11-14T12:00:00Z',observation,{...quote,calendar:{...calendar,version:''}}).calendarIssue,'INVALID_CALENDAR');
 assert.throws(()=>parseTradingCalendar({...raw,days:[raw.days[0],raw.days[0]]}));
 const detached=parseTradingCalendar(raw);assert(Object.isFrozen(detached.days));
});
test('W22 exceptional short Saturday counts; D02 completed trading-day count is not IID eligibility',()=>{
 assert.equal(daily('2026-11-17T03:44:00Z').completedTradingDays,0);
 assert.equal(daily('2026-11-17T10:00:00Z').completedTradingDays,1);
 assert.equal(daily('2026-11-17T10:00:00Z').quality,'GOOD');
 assert.equal(daily('2026-11-18T10:00:00Z').quality,'STALE');
 assert.equal(daily('2026-11-21T04:59:00Z').completedTradingDays,4);
 const five=daily('2026-11-21T05:00:00Z');assert.equal(five.completedTradingDays,5);assert.equal(five.quality,'UNAVAILABLE'); // D02 != IID five-day verdict
 assert.equal(daily('2026-11-23T10:00:00Z').completedTradingDays,6);
 assert.equal(daily('2026-11-21T05:00:00Z','BSE').completedTradingDays,4); // explicit venue-specific closure
 assert.equal(evaluate('2026-11-21T05:01:00Z','2026-11-21T04:59:00Z').ageSeconds,60);
});
test('W22 daily close needs completion and its own date; never a live quote',()=>{
 const current={kind:'DAILY_CLOSE' as const,calendar,exchange:'NSE' as const,observationDate:'2026-11-13',completed:false};
 assert.equal(evaluateFreshness('2026-11-12T18:30:00Z','D02_OHLCV','2026-11-13T08:00:00Z',current).quality,'UNAVAILABLE');
 assert.equal(evaluate('2026-11-14T12:00:00Z','2026-11-12T18:30:00Z').quality,'UNAVAILABLE');
 assert.equal(evaluateFreshness(observation,'D02_OHLCV','2026-11-14T12:00:00Z',quote).quality,'UNAVAILABLE');
 assert.equal(daily('2026-11-25T10:00:00Z').calendarIssue,'MISSING_COVERAGE');
});
test('W22 cache and status use identical evaluator policy; closed CURRENT means usable retained quote, not live tick',()=>{
 const entry={payload:{exchange:'NSE'},provenance:{asOf:observation}};
 const cache=new DhanBoundedCache<typeof entry>(2);cache.setTradingCalendar(calendar);cache.set('k',entry);
 const t='2026-11-15T12:00:00Z';const lookup=cache.peek('k',t);
 assert.equal(lookup.state,'CURRENT');
 const status=freshnessStatus('D01_QUOTES',lookup,t,{outcome:'UNKNOWN',lastFailure:null},quote);
 assert.equal(status.verdict,evaluate(t).quality);assert.equal(status.sessionState,'CLOSED');assert.equal(status.ageBasis,'SESSION_TIME');assert.equal(status.asOf,observation);
 assert.equal(cache.peek('k','2026-11-25T12:00:00Z').state,'UNAVAILABLE');
 assert.equal(freshnessStatus('D02_OHLCV',null,t,{outcome:'UNKNOWN',lastFailure:null}).verdict,'UNKNOWN');
});
test('W22 daily adapter adds assessments only with explicit calendar, retains OHLCV/unknown coverage contract',()=>{
 const input={dto:{timestamp:[Date.parse('2026-11-12T18:30:00Z')/1000],open:[100],high:[105],low:[99],close:[104],volume:[10]},mapping:{companyId:'SYNTH',exchange:'NSE' as const,symbol:'SYNTH',exchangeSegment:'NSE_EQ' as const,dhanSecurityId:'123',mappingProvenance:'SYNTHETIC_PRE_ACCESS_FIXTURE' as const},interval:'1D' as const,fromDate:'2026-11-13',toDate:'2026-11-13'};
 const r=normalizeDhanHistoricalToCandles({...input,tradingCalendar:calendar,evaluationTime:'2026-11-17T12:00:00Z'});assert(r.ok);
 assert.equal(r.value.dailyFreshness?.[0].completedTradingDays,1);assert.equal(r.value.candles[0].close,104);assert.equal(r.value.coverageClaim,'ACCESS_PENDING_UNVERIFIED');
 const old=normalizeDhanHistoricalToCandles(input);assert(old.ok);assert.equal(old.value.dailyFreshness,undefined);
});
test('W22 composed Dhan path normalizes, caches, refresh-skips and reports one consistent session verdict',async()=>{
 const identity=buildD114SecurityIdentity('INE000SYNTH1','EQ')!;
 const registry=new DhanInstrumentRegistry();registry.register({companyId:'SYNTH',isin:identity.isin,securityId:identity.securityId,exchange:'NSE',exchangeSegment:'NSE_EQ',symbol:'SYNTH',dhanSecurityId:'123',mappingProvenance:'SYNTHETIC_PRE_ACCESS_FIXTURE',active:true});
 let calls=0;let now='2026-11-15T12:00:00Z';
 const client=new DhanApiClient({config:{baseUrl:'https://synthetic.invalid',timeoutMs:1000,readiness:'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'} as never,credentialResolver:{resolve:async()=>({accessToken:'synthetic',clientId:'synthetic'})} as never,transport:{async send(){calls++;return{status:200,bodyText:JSON.stringify({status:'success',data:{NSE_EQ:{123:{last_price:100,ohlc:{open:99,close:99,high:101,low:98},net_change:1,volume:100,last_trade_time:'13/11/2026 15:29:00'}}}})}}}});
 const service=new DhanMarketDataService({client,securityMaster:new SecurityMaster(),instrumentRegistry:registry,tradingCalendar:calendar,now:()=>new Date(now)});service.start();
 const req={companyId:'SYNTH',exchangeSegment:'NSE_EQ' as const,securityIdentity:identity};
 assert.equal((await service.getQuote(req)).ok,true);assert.equal((await service.getQuote(req)).ok,true);assert.equal(calls,1);
 const status=service.getFreshness({domain:'D01_QUOTES',...req});assert.equal(status.verdict,'GOOD');assert.equal(status.sessionState,'CLOSED');assert.equal(status.ageSeconds,60);
 now='2026-11-25T12:00:00Z';assert.equal(service.getFreshness({domain:'D01_QUOTES',...req}).verdict,'UNAVAILABLE');
 assert.equal(service.getFreshness({domain:'D02_OHLCV'}).verdict,'UNKNOWN');
 service.stop();
});
