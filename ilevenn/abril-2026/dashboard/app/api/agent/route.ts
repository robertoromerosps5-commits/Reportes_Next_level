import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';
import { Bet } from '@/lib/types';
import { calcDashboardStats } from '@/lib/stats';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un experto en apuestas deportivas y análisis estadístico. Tu objetivo es:

1. **Pronosticar partidos** con análisis profundo: forma reciente, H2H, lesiones, cuotas de mercado, factores contextuales.
2. **Detectar cuotas de valor** (value bets): cuando la probabilidad real supera la probabilidad implícita de la cuota.
3. **Investigar tipsters**: historial, ROI, volumen, deportes, fiabilidad.
4. **Diseñar metodologías ganadoras**: gestión de bankroll, criterio de Kelly, CLV (Closing Line Value).
5. **Analizar tendencias**: mercados de apuestas, movimientos de línea, sharp vs public money.

**Metodología Value Betting:**
- Value Bet: cuando P(éxito) > 1/cuota
- Expected Value = P * (cuota-1) - (1-P)
- Kelly Criterion: f = (bp-q)/b donde b=cuota-1, p=prob real, q=1-p
- Usa Half-Kelly por seguridad

**Cuando analices partidos:**
- Busca información en tiempo real usando web_search
- Analiza: forma (últimos 5), H2H, lesiones, motivación, estadísticas de mercado
- Siempre calcula el EV y si hay valor en la cuota
- Recomienda el tamaño del stake basado en el bankroll actual del usuario

**Formato de respuestas:**
- Usa markdown con secciones claras
- Incluye tablas cuando sea útil
- Siempre concluye con una recomendación clara: APOSTAR / NO APOSTAR y el stake sugerido

Tendrás acceso al historial de apuestas del usuario cuando sea relevante.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, bankroll } = await req.json();

    // Get user's recent stats for context
    const db = getDb();
    const bets = db.prepare('SELECT * FROM bets ORDER BY date DESC LIMIT 20').all() as Bet[];
    const bankrollHistory = db.prepare('SELECT * FROM bankroll ORDER BY date ASC').all() as { amount: number; date: string }[];
    const stats = calcDashboardStats(bets, bankrollHistory);

    const contextNote = `
[CONTEXTO DEL USUARIO]
- Bankroll actual: $${bankroll || stats.currentBankroll.toFixed(2)}
- ROI total: ${stats.roi.toFixed(1)}%
- Win rate: ${stats.winRate.toFixed(1)}%
- Total apuestas (settleds): ${stats.totalBets - stats.pendingBets}
- P&L total: $${stats.totalProfit.toFixed(2)}
`;

    const systemWithContext = SYSTEM_PROMPT + '\n\n' + contextNote;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-opus-4-7',
            max_tokens: 8192,
            thinking: { type: 'adaptive' },
            output_config: { effort: 'high' },
            system: systemWithContext,
            tools: [
              {
                type: 'web_search_20260209',
                name: 'web_search',
              } as Anthropic.WebSearchTool20260209,
            ],
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            stream: true,
          });

          let fullText = '';

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                fullText += event.delta.text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
                );
              }
            } else if (event.type === 'message_stop') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`)
              );
            }
          }

          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error en el agente' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
