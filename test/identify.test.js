import test from 'node:test';
import assert from 'node:assert/strict';
import { app, resetContactsDatabase } from '../index.js';

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('repeated email-only requests do not create duplicate secondary contacts', async () => {
  resetContactsDatabase();
  const server = await startServer();

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${server.address().port}/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' })
    });
    const firstBody = await firstResponse.json();

    const secondResponse = await fetch(`http://127.0.0.1:${server.address().port}/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' })
    });
    const secondBody = await secondResponse.json();

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(firstBody.contact.secondaryContactIds.length, 0);
    assert.equal(secondBody.contact.secondaryContactIds.length, 0);
    assert.equal(secondBody.contact.primaryContactId, firstBody.contact.primaryContactId);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('matching by phone only creates a secondary only when the combination is new', async () => {
  resetContactsDatabase();
  const server = await startServer();

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${server.address().port}/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+123456789' })
    });
    const firstBody = await firstResponse.json();

    const secondResponse = await fetch(`http://127.0.0.1:${server.address().port}/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+123456789' })
    });
    const secondBody = await secondResponse.json();

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(secondBody.contact.secondaryContactIds.length, 0);
    assert.equal(firstBody.contact.primaryContactId, secondBody.contact.primaryContactId);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
