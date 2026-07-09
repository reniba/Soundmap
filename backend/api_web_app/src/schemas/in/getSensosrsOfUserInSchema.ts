import z from "zod";

export const GetSensorsOfUserInSchema = z.object({
    sensorId: z.coerce.number().int().positive().max(2147483647).optional(),
    sensorName: z.string().min(1).optional(),
    areaId: z.coerce.number().int().positive().max(2147483647).optional(),
    areaName: z.string().min(1).optional(),
    activeInArea: z.preprocess(v => v === "true" ? true : v === "false" ? false : v, z.boolean()).optional()
});

export type GetSensorsOfUserIn = z.infer<typeof GetSensorsOfUserInSchema>;