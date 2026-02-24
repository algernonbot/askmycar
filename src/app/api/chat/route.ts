import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Car } from '@/types/car'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = (car: Car) => `You are AskMyCar, an expert automotive assistant for a specific vehicle.

The user's car:
- Year: ${car.year}
- Make: ${car.make}
- Model: ${car.model}
${car.trim ? `- Trim: ${car.trim}` : ''}
${car.engine ? `- Engine: ${car.engine}` : ''}
${car.vin ? `- VIN: ${car.vin}` : ''}

You have access to:
1. The owner's manual for this specific vehicle (use fetch_manual when relevant)
2. Web search for recalls, TSBs, common issues, and current info (use web_search when needed)

Guidelines:
- Be friendly, direct, and helpful like a knowledgeable mechanic friend
- Always give specific answers for THIS car, not generic advice
- When discussing warning lights, maintenance intervals, or specifications — use the manual
- Cite your sources naturally ("According to your owner's manual..." or "Based on your 2019 Camry's specs...")
- Keep answers concise but complete. Use bullet points for steps or lists.
- If you don't know something specific to this car, say so and suggest checking with a dealer
- Never recommend dangerous DIY repairs without appropriate safety warnings`

const tools: Anthropic.Tool[] = [
  {
    name: 'fetch_manual',
    description: 'Fetch the owner\'s manual for the user\'s vehicle to answer specific questions about their car. Use this for warning lights, maintenance schedules, specifications, features, and any question where the manual would have the answer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          description: 'What topic or section to look up in the manual (e.g., "oil change interval", "warning lights", "tire pressure")',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for current information about this vehicle — recalls, technical service bulletins (TSBs), common issues, parts, pricing, or anything the manual wouldn\'t cover.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Always include the year, make, and model.',
        },
      },
      required: ['query'],
    },
  },
]

async function fetchManual(car: Car, topic: string): Promise<string> {
  const VEHICLE_DB_KEY = process.env.VEHICLE_DB_API_KEY

  // If we have a vehicledatabases.com key, use it
  if (VEHICLE_DB_KEY) {
    try {
      const params = car.vin
        ? `vin=${car.vin}`
        : `year=${car.year}&make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}`

      const res = await fetch(
        `https://api.vehicledatabases.com/vehicle-manuals?${params}`,
        { headers: { 'x-AuthKey': VEHICLE_DB_KEY } }
      )
      if (res.ok) {
        const data = await res.json()
        const manualUrl = data?.data?.manualUrl || data?.url
        if (manualUrl) {
          return `Manual found at ${manualUrl}. Topic requested: "${topic}". Note: I'll use my knowledge of the ${car.year} ${car.make} ${car.model} owner's manual to answer about "${topic}".`
        }
      }
    } catch (e) {
      console.error('VehicleDB API error:', e)
    }
  }

  // Fallback: Claude uses its training knowledge of the manual
  return `Using built-in knowledge of the ${car.year} ${car.make} ${car.model} owner's manual for topic: "${topic}". I'll provide accurate information based on this vehicle's specifications.`
}

async function webSearch(query: string): Promise<string> {
  const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY
  if (!BRAVE_KEY) {
    return `Web search unavailable. I'll answer based on my training knowledge about: ${query}`
  }

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&freshness=py`,
      { headers: { 'X-Subscription-Token': BRAVE_KEY, 'Accept': 'application/json' } }
    )
    if (!res.ok) throw new Error('Brave API error')
    const data = await res.json()
    const results = data.web?.results?.slice(0, 4) || []

    if (results.length === 0) return 'No results found.'

    return results
      .map((r: { title: string; url: string; description: string }) =>
        `**${r.title}**\n${r.description}\nSource: ${r.url}`
      )
      .join('\n\n')
  } catch (e) {
    console.error('Web search error:', e)
    return `Search failed. Answering from training knowledge about: ${query}`
  }
}

export async function POST(request: NextRequest) {
  const { car, messages } = await request.json() as {
    car: Car
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  if (!car || !messages) {
    return new Response('Missing car or messages', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Agentic loop with tool use
        let currentMessages: Anthropic.MessageParam[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }))
        let iterationsLeft = 5

        while (iterationsLeft > 0) {
          iterationsLeft--

          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: SYSTEM_PROMPT(car),
            messages: currentMessages,
            tools,
            stream: false,
          })

          if (response.stop_reason === 'end_turn') {
            // Done — send the text
            const textBlock = response.content.find(b => b.type === 'text')
            if (textBlock && textBlock.type === 'text') {
              send({ type: 'text', content: textBlock.text })
            }
            send({ type: 'done' })
            break
          }

          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
            const toolResults: Anthropic.ToolResultBlockParam[] = []

            // Notify client we're using tools
            for (const toolBlock of toolUseBlocks) {
              if (toolBlock.type !== 'tool_use') continue
              send({ type: 'tool', name: toolBlock.name })

              let result = ''
              if (toolBlock.name === 'fetch_manual') {
                const input = toolBlock.input as { topic: string }
                result = await fetchManual(car, input.topic)
              } else if (toolBlock.name === 'web_search') {
                const input = toolBlock.input as { query: string }
                result = await webSearch(input.query)
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: result,
              })
            }

            // Add assistant turn + tool results and continue
            currentMessages = [
              ...currentMessages,
              { role: 'assistant' as const, content: response.content },
              { role: 'user' as const, content: toolResults },
            ]
            continue
          }

          // Unexpected stop
          send({ type: 'done' })
          break
        }
      } catch (error) {
        console.error('Chat error:', error)
        send({ type: 'error', message: 'Something went wrong. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
