import z from "zod";

export const GetSensorLastStateOutSchema = z.object({
    name: z.string(),
    active: z.coerce.boolean(),
    dbAverage: z.coerce.number(),
    latitude: z.coerce.number().refine(lat => lat >= -90 && lat <= 90, { message: "Latitude must be between -90 and 90" }),
    longitude: z.coerce.number().refine(lon => lon >= -180 && lon <= 180, { message: "Longitude must be between -180 and 180" }),
});

export type GetSensorLastStateOut = z.infer<typeof GetSensorLastStateOutSchema>;