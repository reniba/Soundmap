import z from "zod";

export const DeleteAreaInSchema = z.object({
  areaId: z.coerce.number().int().positive("Area ID deve ser um número positivo")
});

export type DeleteAreaIn = z.infer<typeof DeleteAreaInSchema>;