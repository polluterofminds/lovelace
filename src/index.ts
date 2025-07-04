import { Context, Hono, Next } from 'hono'
import { ALLOWED_USERS, getSupabase } from './utils/auth';
import { readdir, mkdir, unlink, rmdir } from "node:fs/promises";
import { chat } from './utils/ai';
import { cors } from "hono/cors";

type Bindings = {
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type Variables = {
  email: string;
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

app.use(cors());

app.use("*", async (c: Context, next: Next) => {
  const supabase = getSupabase();
  const token = c.req.header("hunter-token");
  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (token === "TEST") {
    c.set("email", "test@email.com");
    await next()
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      console.log("No user found");
      return c.json({ message: "Unauthorized" }, 401)
    }

    console.log(user);

    if (!ALLOWED_USERS.includes(user?.email || "")) {
      console.log("Not on the allow list");
      return c.json({ message: "Unauthorized" }, 401);
    }
    c.set("email", user.email);
    await next();
  }
});

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

app.post('/chat/:chatId/messages', async (c) => {
  try {
    const userEmail = c.get("email") || "";
    const normalizedUserEmail = userEmail.replace(".", "_").toLowerCase();
    const chatId = c.req.param("chatId");

    const { messages } = await c.req.json();

    await Bun.write(`${normalizedUserEmail}/${chatId}/messages.json`, JSON.stringify(messages));

    return c.json({ message: "Success" }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error "}, 500);
  }
})

//  Send message on existing chat
app.post('chat/:chatId', async (c) => {
  try {
    const { messages } = await c.req.json();

    // Set up streaming response
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    
    // Create a new readable stream
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
})

//  Create a new chat
app.post('/chat', async (c) => {
  try {
    const userEmail = c.get("email") || "";
    const normalizedUserEmail = userEmail.replace(".", "_").toLowerCase();
    const { chatId } = await c.req.json();
    console.log({userEmail, chatId});
    await mkdir(`${normalizedUserEmail}/${chatId}`, { recursive: true });
    await Bun.write(`${normalizedUserEmail}/${chatId}/messages.json`, JSON.stringify([]));
    return c.json({ data: chatId }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
})

app.get('/chat', async (c) => {
  try {
    const userEmail = c.get("email") || "";
    const normalizedUserEmail = userEmail.replace(".", "_").toLowerCase();
    const files = await readdir(`${normalizedUserEmail}`);
    return c.json({ data: files.filter((f: string) => !f.includes(".DS")) });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
})

app.get('/chat/:chatId', async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const userEmail = c.get("email") || "";
    const normalizedUserEmail = userEmail.replace(".", "_").toLowerCase();

    const file = Bun.file(`${normalizedUserEmail}/${chatId}/messages.json`);

    if (!file) {
      return c.json({ message: "Chat not found" }, 404);
    }

    let chatHistory = await file.json();
    if (!file || !chatHistory) {
      chatHistory = [];
    }

    return c.json({ data: chatHistory }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
})

app.delete("/chat/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const userEmail = c.get("email") || "";
    const normalizedUserEmail = userEmail.replace(".", "_").toLowerCase();
    await unlink(`${normalizedUserEmail}/${chatId}/messages.json`);
    
    await rmdir(`${normalizedUserEmail}/${chatId}`);
    return c.json({ message: "Success" }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
})

export default app
