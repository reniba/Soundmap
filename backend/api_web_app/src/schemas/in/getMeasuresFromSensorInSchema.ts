import z from "zod";

export const GetMeasuresFromSensorInSchema = z.object({
    areaId: z.coerce.number().int().positive("Area ID deve ser um número positivo"),
    sensorId: z.coerce.number().int().positive("Sensor ID deve ser um número positivo").optional(),
    sensorName: z.string().min(1, "O nome do sensor deve ter pelo menos 1 caractere").optional(),
    windowStart: z.coerce.date({ message: "Window Start deve ser uma data válida" }).default(() => new Date(Date.now() - 1 * 60 * 60 * 1000)), // Default para 1 hora atrás
    windowEnd: z.coerce.date({ message: "Window End deve ser uma data válida" }).default(() => new Date()) // Default para agora
});

export type GetMeasuresFromSensorIn = z.infer<typeof GetMeasuresFromSensorInSchema>;
