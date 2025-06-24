// supabase/functions/log-cdip-best-surf/index.ts
export default async function handler(request: Request): Promise<Response> {
  console.log("👋 hello from log-cdip-best-surf");
  return new Response("HELLO", { status: 200 });
}