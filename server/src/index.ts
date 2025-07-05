import { Hono } from 'hono'
import { chat } from './utils/ai';
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

// Send message on existing chat (AI streaming response)
app.post('/chat/:chatId', async (c) => {
  try {
    const { messages } = await c.req.json();
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chat(
            controller,
            messages
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return c.body(stream);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

export default app
