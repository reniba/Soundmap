import z from "zod";

export const SensorOutSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string(),
    areaId: z.number(),
    areaName: z.string(),
    activeInArea: z.boolean(),
    originId: z.coerce.number().int().positive()
});

export const GetSensorsOfUserOutSchema = z.object({
  sensors: z.array(SensorOutSchema).min(0)
});

export type GetSensorsOfUserOut = z.infer<typeof GetSensorsOfUserOutSchema>;