import { getRequest } from "@tanstack/react-start/server";
import { drizzle, type AnyD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

type CloudflareRequest = Request & {
  runtime?: { cloudflare?: { env?: { DB?: AnyD1Database } } };
};

let devBinding: Promise<AnyD1Database> | undefined;

// `vite dev` does not run Nitro's Cloudflare emulation, so open the same local D1
// state that `wrangler d1 migrations apply DB --local` writes to.
function getDevBinding(): Promise<AnyD1Database> {
  devBinding ??= import("wrangler").then(async ({ getPlatformProxy }) => {
    const proxy = await getPlatformProxy<{ DB: AnyD1Database }>();
    return proxy.env.DB;
  });
  return devBinding;
}

export async function getDb() {
  let binding = (getRequest() as CloudflareRequest).runtime?.cloudflare?.env?.DB;
  if (!binding && import.meta.env.DEV) binding = await getDevBinding();
  if (!binding) throw new Error("D1 binding `DB` is not available in this environment.");
  return drizzle(binding, { schema });
}
