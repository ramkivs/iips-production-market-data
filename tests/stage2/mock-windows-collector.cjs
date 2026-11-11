'use strict';
// Synthetic loopback servers only. Never used by the collector itself.
const net = require('node:net'), http = require('node:http'), fs = require('node:fs');
const [pipeName, ready, scenario] = process.argv.slice(2);
const holding = { symbol:'SENSITIVE_SYNTHETIC_SYMBOL', companyId:'COMP-SECRET', active:true, securityIdentity:{ securityId:'ISIN:INE000SYNTH1:EQ' }, exchange:'NSE' };
const initial=scenario==='initial';
const count=initial?64:1, revision=initial?1:3;
const list=scenario==='empty'?[]:[{portfolioId:'PORTFOLIO-SECRET',revision,holdingsCount:count,isSaved:false,weightSumPercentage:100,provenanceDigest:'c'.repeat(64)}];
if(scenario==='multi')list.push({...list[0],portfolioId:'PORTFOLIO-SECOND'});
const detail={...list[0],holdings:Array.from({length:count},()=>({...holding})),contributions:[]};
const pipe=net.createServer(s=>{let b=Buffer.alloc(0);s.on('error',()=>{});s.on('data',data=>{
 b=Buffer.concat([b,data]);if(b.length<4||b.length<4+b.readUInt32BE())return;
 const req=JSON.parse(b.subarray(4,4+b.readUInt32BE()));
 if(scenario==='closed'){s.destroy();return;}
 let result=req.op==='portfolio.list'?list:req.op==='portfolio.get'?{...detail,portfolioId:req.payload.portfolioId}:[{revision,holdingsCount:count,operation:'INITIAL',committedAt:'2026-01-01T00:00:00.000Z'}];
 if(scenario==='mismatch'&&req.op==='portfolio.get')result={...result,revision:99};
 if(scenario==='invalid-shape'&&req.op==='portfolio.list')result={portfolios:list};
 let response={v:1,ok:true,op:req.op,result};
 if(scenario==='class-a')response={v:1,ok:false,op:req.op,outcome:'RESOURCE_UNAVAILABLE'};
 const body=Buffer.from(scenario==='bad-json'?'{':JSON.stringify(response));const n=Buffer.alloc(4);n.writeUInt32BE(body.length);s.end(Buffer.concat([n,body]));
 });});
const irr=http.createServer((q,r)=>{r.setHeader('Content-Type','application/json');let x={};if(q.url==='/api/user-portfolios') x={portfolios:[{portfolioId:'PORTFOLIO-SECRET'}]};else if(q.url==='/api/user-portfolios/PORTFOLIO-SECRET') x={portfolio:{revision,totalHoldingsCount:count}};else if(q.url==='/api/investment/portfolio/PORTFOLIO-SECRET/identities') x={identities:[{state:'RESOLVED',reason:null,resolutionBasis:'ISIN',issuerId:'ISSUER-SECRET'}],directory:{rosterVersion:'a'.repeat(64),rosterDigest:'a'.repeat(64)}};else if(q.url==='/api/investment/coverage/investment') x={issuers:[{issuerId:'ISSUER-SECRET',state:'COVERED'}]};else {r.statusCode=404};r.end(JSON.stringify(x));});
const market=http.createServer((q,r)=>{r.setHeader('Content-Type','application/json');if(q.headers.authorization!=='Bearer SECRET_TOKEN'){r.statusCode=401;r.end('{}');return} if(q.method==='POST'&&q.url==='/v1/identity/resolve')r.end(JSON.stringify({status:'QUALIFIED'})); else if(q.url.startsWith('/v1/freshness?domain=D01_QUOTES')) r.end(JSON.stringify({verdict:'GOOD',asOf:'2026-01-01T00:00:00.000Z',receivedAt:'2026-01-01T00:00:01.000Z',evaluatedAt:'2026-01-01T00:00:02.000Z',eligibleForUse:true})); else if(q.url==='/v1/freshness?domain=D02_OHLCV')r.end(JSON.stringify({cacheState:'NOT_AVAILABLE'}));else {r.statusCode=404;r.end('{}')}});
pipe.listen(`\\\\.\\pipe\\${pipeName}`,()=>irr.listen(0,'127.0.0.1',()=>market.listen(0,'127.0.0.1',()=>fs.writeFileSync(ready,JSON.stringify({irr:irr.address().port,market:market.address().port})))));
