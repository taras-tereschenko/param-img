import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

import { getEnv } from "@/lib/env";

const sql = neon(getEnv().DATABASE_URL);
export const db = drizzle(sql, { schema });

export * from "./schema";
