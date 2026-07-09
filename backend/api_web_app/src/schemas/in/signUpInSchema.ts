import z from "zod";

export const SignUpInSchema = z.object({
    email: z.string().email("Email inválido"),
    username: z.string().min(1, "Username é obrigatório"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export type SignUpIn = z.infer<typeof SignUpInSchema>;
