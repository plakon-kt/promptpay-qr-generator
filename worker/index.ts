import { generatePromptPayPayload } from '../src/lib/promptpay';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/generate') {
      try {
        let target: string | null = null;
        let amount: string | null = null;

        if (request.method === 'POST') {
          const body: any = await request.json();
          console.log("📥 [Worker] ได้รับข้อมูล JSON:", body);
          target = body.target;
          amount = body.amount;
        } else if (request.method === 'GET') {
          target = url.searchParams.get("target");
          amount = url.searchParams.get("amount");
        } else {
          return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
        }

        if (!target) {
          throw new Error("กรุณาระบุ target (เบอร์โทร/เลขบัตร)");
        }

        const payload = generatePromptPayPayload({
          target,
          amount: amount ? Number(amount) : undefined
        });

        return new Response(JSON.stringify({ payload }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
