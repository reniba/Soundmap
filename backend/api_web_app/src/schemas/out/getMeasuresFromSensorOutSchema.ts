import z from "zod";

export const MeasureItemSchema = z.object({
    dbAvg: z.number(),
    dbMax: z.number(),
    latitude: z.coerce.number().refine(lat => lat >= -90 && lat <= 90, { message: "Latitude must be between -90 and 90" }),
    longitude: z.coerce.number().refine(lon => lon >= -180 && lon <= 180, { message: "Longitude must be between -180 and 180" }),
    windowEnd: z.string().or(z.date()),
    windowStart: z.string().or(z.date())
});

export const GetMeasuresFromSensorOutSchema = z.object({
    measures: z.array(MeasureItemSchema)
});

export type MeasureItem = z.infer<typeof MeasureItemSchema>;
export type GetMeasuresFromSensorOut = z.infer<typeof GetMeasuresFromSensorOutSchema>;
