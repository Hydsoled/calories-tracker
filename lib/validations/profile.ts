import { z } from "zod";
import { timezoneSchema } from "../dates/local-day.ts";
export const profileInputSchema = z.strictObject({ displayName: z.string().trim().max(80), timezone: timezoneSchema });
export const profileRowSchema = z.object({ display_name: z.string().nullable(), timezone: timezoneSchema });
export type ProfileState = { error?: string; success?: string; fields?: Record<string, string> };
