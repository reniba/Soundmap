import z from "zod";

export const GetSensorLastStateInSchema = z.object({
    sensorId: z.coerce.number().int().positive(),
});

export type GetSensorLastStateIn = z.infer<typeof GetSensorLastStateInSchema>;