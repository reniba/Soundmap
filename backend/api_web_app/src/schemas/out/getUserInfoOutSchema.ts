import z from "zod";

export const GetUserInfoOutSchema = z.object({
  username: z.string().min(1, "Username não pode ser vazio"),
  email: z.email("E-mail inválido"),
});

export type GetUserInfoOut = z.infer<typeof GetUserInfoOutSchema>;