import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LayerDialog } from '@cloudflare/kumo';

const source = await readFile(new URL('../src/shared/components/InstanceConfirmationActions.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } });
const resolved = outputText.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => `from ${JSON.stringify(import.meta.resolve(specifier))}`);
const { instanceConfirmationActions } = await import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`);

function render(pending = false) {
  return renderToStaticMarkup(React.createElement(LayerDialog.Root, { open: true, dismissDisabled: pending },
    instanceConfirmationActions({ loading: pending, onConfirm() {}, children: '确认开启生产锁' })));
}
test('instance confirmations satisfy the real Kumo runtime contract', () => {
  const html = render(); // The former two-Button implementation throws here.
  assert.match(html, /确认开启生产锁/);
  assert.match(html, /取消/);
  assert.equal((html.match(/<button\b/g) ?? []).length, 2);
});
test('pending instance confirmations disable both submission and dismissal', () => {
  const buttons = render(true).match(/<button\b[^>]*>/g) ?? [];
  assert.equal(buttons.length, 2);
  assert.ok(buttons.every(button => /disabled/.test(button)));
});

test('confirmation actions remain a direct Kumo Content child', () => {
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(LayerDialog.Root, { open: true },
    React.createElement(LayerDialog.Content, null,
      React.createElement(LayerDialog.Title, null, '开启生产锁'),
      React.createElement(LayerDialog.Body, null, '确认开启'),
      instanceConfirmationActions({ onConfirm() {}, children: '确认' })))));
});
