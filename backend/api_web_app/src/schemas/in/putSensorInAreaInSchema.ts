import z from "zod";

export const PutSensorInAreaInSchema = z.object({
    sensorId: z.coerce.number().int().positive(),
    areaId: z.coerce.number().int().positive(),
    activeInArea: z.boolean().default(false),
});

export type PutSensorInAreaIn = z.infer<typeof PutSensorInAreaInSchema>;