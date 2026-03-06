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
    const deployment = event.payload.deployment;
    
    const commitMsg = (deployment.meta.gitCommitMessage ?? deployment.meta.githubCommitMessage)?.slice(0, 50) ?? 'No commit message';
    const author = deployment.meta.gitCommitAuthorName ?? deployment.meta.githubCommitAuthorName ?? 'Unknown author';



    // Determine embed color based on event type (e.g., success=green, error=red, building=yellow)
    let embedColor = 0x34d399; // Default Green for success
    if (event.type.includes('error') || event.type.includes('fail')) {
      embedColor = 0xef4444; // Red
    } else if (event.type.includes('build')) {
      embedColor = 0xfacc15; // Yellow
    }

    const discordMessage = {
      embeds: [
        {
          title: `🚀 Vercel Deployment: ${event.type}`,
          description: `**Project:** [${deployment.name}](https://${deployment.url}) \`${event.payload.target}\``,
          url: `https://${deployment.url}`,
          color: embedColor,
          fields: [
            {
              name: "Commit",
              value: commitMsg,
              inline: false
            },
            {
              name: "Author",
              value: author,
              inline: true
            }
          ],
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
              url: `https://${deployment.url}`
            },
            {
              type: 2, // Button
              style: 5, // URL Links MUST be style 5
              label: "Inspect",
              emoji: { name: "🔍" },
              url: deployment.inspectorUrl
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
