import z from "zod";

export const DeleteSensorInSchema = z.object({
    sensorId: z.coerce.number().int().positive(),
});

export type DeleteSensorIn = z.infer<typeof DeleteSensorInSchema>;