import { z } from "zod";

export const SceneSchema = z.object({
  name: z.string(),
  description: z.string(),
  durationSeconds: z.number(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const BriefSchema = z.object({
  mood: z.string(),
  durationSeconds: z.number(),
  palette: z.array(z.string()),
  fonts: z.array(z.string()),
  scenes: z.array(SceneSchema),
  cameraStyle: z.string().optional(),
});
export type Brief = z.infer<typeof BriefSchema>;

export const CodeFileMapSchema = z.record(z.string(), z.string());
export type CodeFileMap = z.infer<typeof CodeFileMapSchema>;

export const PlanResultSchema = z.discriminatedUnion("valid", [
  z.object({
    valid: z.literal(true),
    brief: BriefSchema,
  }),
  z.object({
    valid: z.literal(false),
    reason: z.string(),
  }),
]);
export type PlanResult = z.infer<typeof PlanResultSchema>;

export const AssetRefSchema = z.object({
  url: z.string(),
  description: z.string().optional(),
});
export type AssetRef = z.infer<typeof AssetRefSchema>;
