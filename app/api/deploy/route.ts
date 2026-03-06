import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.VERCEL_WEBHOOK_SECRET) return false;
  
  const expectedSignature = crypto
    .createHmac('sha1', process.env.VERCEL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-vercel-signature');
    
    if (!verifySignature(payload, signature)) {
      console.error("Invalid signature")
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log("🚀 ~ POST ~ event:", event)
    const deployment = event.payload.deployment;
    console.log("🚀 ~ POST ~ deployment:", deployment)
    
    const discordMessage = {
      content: `**${(deployment.meta.gitCommitMessage??deployment.meta.githubCommitMessage)?.slice(0, 50)}**`+
               `🚀 **${event.type.replace('deployment.', '').toUpperCase()}** \n` +
               `📱 ${deployment.name}\n` +
               `🌐 ${event.payload.target}\n` +
               `👤 ${deployment.meta.gitCommitAuthorName??deployment.meta.githubCommitAuthorName}\n` +
               `🔗 [배포 상황](${deployment.inspectorUrl})\n` +
               `🔗 https://${deployment.url}`
    };

    await fetch(process.env.DISCORD_WEBHOOK_URL??'', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordMessage),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
