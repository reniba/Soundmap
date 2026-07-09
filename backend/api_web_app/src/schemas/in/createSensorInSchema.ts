import z from "zod";

export const CreateSensorInSchema = z.object({
    name: z.string().min(1, "O nome do sensor é obrigatório"),
    areaId: z.coerce.number().int().positive(), 
});

export type CreateSensorIn = z.infer<typeof CreateSensorInSchema>;