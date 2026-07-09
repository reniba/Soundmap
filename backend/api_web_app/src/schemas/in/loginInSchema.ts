import z from "zod";

export const LoginInSchema = z.object({
    emailOrUsername: z.email().or(z.string().min(1, "E-mail ou username é obrigatório")),
    password: z.string().min(1, "Senha é obrigatória")
});

export type LoginIn = z.infer<typeof LoginInSchema>;
