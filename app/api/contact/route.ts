import { NextResponse } from "next/server";
import { fetch as proxyFetch, ProxyAgent } from "undici";

export const runtime = "nodejs";

type ContactPayload = {
  name?: unknown;
  contact?: unknown;
  company?: unknown;
  message?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = text(payload.name, 120);
  const contact = text(payload.contact, 200);
  const company = text(payload.company, 200);
  const message = text(payload.message, 2000);

  if (!name || !contact) {
    return NextResponse.json(
      { error: "Name and contact are required" },
      { status: 400 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_THREAD_ID;
  const proxyUrlValue = process.env.TELEGRAM_PROXY_URL;
  const proxyUser = process.env.TELEGRAM_PROXY_USER;
  const proxyPassword = process.env.TELEGRAM_PROXY_PASSWORD;

  if (
    !token ||
    !chatId ||
    !proxyUrlValue ||
    !proxyUser ||
    !proxyPassword
  ) {
    console.error("Telegram contact form environment variables are not configured");
    return NextResponse.json(
      { error: "Contact delivery is not configured" },
      { status: 503 },
    );
  }

  const lines = [
    "<b>Новая заявка с ivanov.works</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${escapeHtml(contact)}`,
    company ? `<b>Компания:</b> ${escapeHtml(company)}` : "",
    message ? `<b>Сообщение:</b>\n${escapeHtml(message)}` : "",
  ].filter(Boolean);

  const telegramPayload: Record<string, string | number> = {
    chat_id: chatId,
    text: lines.join("\n"),
    parse_mode: "HTML",
    disable_web_page_preview: 1,
  };

  if (threadId) telegramPayload.message_thread_id = Number(threadId);

  let proxy: ProxyAgent | null = null;
  try {
    const proxyUrl = new URL(proxyUrlValue);
    if (proxyUrl.protocol !== "http:" && proxyUrl.protocol !== "https:") {
      throw new Error("Unsupported Telegram proxy protocol");
    }
    proxyUrl.username = proxyUser;
    proxyUrl.password = proxyPassword;
    proxy = new ProxyAgent(proxyUrl.toString());

    const response = await proxyFetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telegramPayload),
        dispatcher: proxy,
      },
    );
    await response.text();

    if (!response.ok) {
      console.error("Telegram contact delivery failed", response.status);
      return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
    }
  } catch {
    console.error("Telegram contact delivery failed");
    return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
  } finally {
    if (proxy) await proxy.close().catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
