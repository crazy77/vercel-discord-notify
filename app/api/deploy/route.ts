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
    
    const commitMsg = (deployment.meta.gitCommitMessage ?? deployment.meta.githubCommitMessage)?.slice(0, 50) ?? 'No commit message';
    const author = deployment.meta.gitCommitAuthorName ?? deployment.meta.githubCommitAuthorName ?? 'Unknown author';



    const eventTypeConfig: Record<string, { title: string; color: number }> = {
      'deployment.created': { title: 'Deployment Created', color: 0x3b82f6 }, // Blue
      'deployment.cleanup': { title: 'Deployment Cleanup', color: 0x6b7280 }, // Gray
      'deployment.error': { title: 'Deployment Error', color: 0xef4444 }, // Red
      'deployment.canceled': { title: 'Deployment Canceled', color: 0xf59e0b }, // Orange
      'deployment.succeeded': { title: 'Deployment Succeeded', color: 0x22c55e }, // Green
      'deployment.promoted': { title: 'Deployment Promoted', color: 0x8b5cf6 }, // Purple
      'deployment.rollback': { title: 'Deployment Rollback', color: 0xf97316 }, // Orange
      'deployment.checkrun.start': { title: 'Checkrun Started', color: 0x0ea5e9 }, // Light Blue
      'deployment.checkrun.cancel': { title: 'Checkrun Canceled', color: 0x94a3b8 }, // Slate
    };

    const config = eventTypeConfig[event.type] || { title: `Vercel Deployment: ${event.type}`, color: 0xa8a29e };

    const visitUrl = deployment.url ? `https://${deployment.url}` : 'https://vercel.com/dashboard';
    const inspectUrl = deployment.inspectorUrl ? (deployment.inspectorUrl.startsWith('http') ? deployment.inspectorUrl : `https://${deployment.inspectorUrl}`) : 'https://vercel.com/dashboard';

    const discordMessage = {
      embeds: [
        {
          title: `🚀 ${config.title}`,
          description: `**Project:** [${deployment.name}](${visitUrl}) \`${event.payload.target}\`\n**Commit:** ${commitMsg}\n**Author:** ${author}`,
          url: visitUrl,
          color: config.color,
          timestamp: new Date().toISOString(),
          footer: {
            text: "Vercel Deploy Notifier",
            icon_url: "https://assets.vercel.com/image/upload/q_auto/front/favicon/vercel/180x180.png"
          }
        }
      ],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // URL Links MUST be style 5
              label: "Visit",
              emoji: { name: "🔗" },
              url: visitUrl
            },
            {
              type: 2, // Button
              style: 5, // URL Links MUST be style 5
              label: "Inspect",
              emoji: { name: "🔍" },
              url: inspectUrl
            }
          ]
        }
      ]
    };

    // The image property in the embed is intentionally set to API OG URL.
    // If it resolves, Discord will display it. If not, Discord will just ignore it.
    
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
