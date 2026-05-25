import { consumeStream, convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-5-mini',
    system:
      'شما مشاور سازمانی Morov هستید. به سوالات کاربران به فارسی پاسخ دهید. پاسخ‌های خود را واضح، مختصر و مفید ارائه دهید.',
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
