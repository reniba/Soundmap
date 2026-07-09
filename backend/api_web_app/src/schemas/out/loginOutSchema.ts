import z from "zod";

export const LoginOutSchema = z.object({
  token: z.string(),
});

export type LoginOut = z.infer<typeof LoginOutSchema>;