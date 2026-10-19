// Focused, replayable verification of CVE-2026-93749 against the installed package.
// Run from the repository root: node --test evidence/dependency-security/2026-10-19/source-map-regression.test.mjs
// No network, huge serialization, or intentionally hanging baseline payload is used.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SourceMapConsumer, SourceMapGenerator, SourceNode } = require('source-map-js');
const postcss = require('postcss');
const flat = { version: 3, sources: ['input.css'], sourcesContent: ['a { color: red; }'], names: [], mappings: 'AAAA' };
const indexed = (line, column = 0, map = flat) => ({
  version: 3, sections: [{ offset: { line, column }, map }],
});

test('patched consumer rejects enormous section line offsets before mapping expansion', () => {
  assert.throws(() => new SourceMapConsumer(indexed(1e12)), /must not exceed/);
});

test('patched consumer rejects malformed line and column offsets', () => {
  for (const value of [-1, 1.5, NaN, Infinity, -Infinity, 9007199254740992, '1', null, undefined, {}]) {
    for (const field of ['line', 'column']) {
      const map = indexed(0);
      // Assign after construction so undefined is not replaced by a default parameter.
      map.sections[0].offset[field] = value;
      assert.throws(() => new SourceMapConsumer(map), /non-negative integers/, `${field}=${String(value)}`);
    }
  }
});

test('nested indexed offsets cannot bypass the cumulative line bound', () => {
  assert.throws(() => new SourceMapConsumer(indexed(6e6, 0, indexed(6e6))), /including offsets of nested sections/);
});

test('ordinary indexed source maps retain correct positions', () => {
  const consumer = new SourceMapConsumer(indexed(2));
  const mappings = [];
  consumer.eachMapping(mapping => mappings.push(mapping));
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].generatedLine, 3);
  assert.equal(mappings[0].originalLine, 1);
  assert.equal(mappings[0].source, 'input.css');
});

test('source node safely handles a valid offset past the end of generated code', () => {
  const node = SourceNode.fromStringWithSourceMap('a {}\n', new SourceMapConsumer(indexed(1e7)));
  assert.equal(node.toString(), 'a {}\n');
  assert.ok(node.children.length < 10);
});

test('source map generator preserves line-gap serialization', () => {
  const generator = new SourceMapGenerator({ file: 'output.css' });
  generator.addMapping({ generated: { line: 1, column: 0 } });
  generator.addMapping({ generated: { line: 1003, column: 0 } });
  assert.equal(generator.toJSON().mappings, 'A' + ';'.repeat(1002) + 'A');
});

test('PostCSS consumes previous maps and produces usable CSS/source-map output', async () => {
  const result = await postcss([]).process('a { color: red; }', {
    from: 'input.css', to: 'output.css', map: { prev: flat, inline: false },
  });
  assert.ok(result.css.includes('color: red'));
  assert.ok(result.map);
  const consumer = new SourceMapConsumer(result.map.toJSON());
  const position = consumer.originalPositionFor({ line: 1, column: 0 });
  assert.equal(position.source, 'input.css');
  assert.equal(position.line, 1);
});
