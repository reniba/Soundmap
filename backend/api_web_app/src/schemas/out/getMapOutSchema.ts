import z from "zod";

export const MapSensorSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string(),
    active: z.coerce.boolean(),
    dbAverage: z.coerce.number(),
    latitude: z.coerce.number().refine(lat => lat >= -90 && lat <= 90, { message: "Latitude must be between -90 and 90" }),
    longitude: z.coerce.number().refine(lon => lon >= -180 && lon <= 180, { message: "Longitude must be between -180 and 180" }),
});

export const AppMapSensorSchema = z.object({
    sensorId: z.string(),
    name: z.string(),
    active: z.coerce.boolean(),
    dbAverage: z.coerce.number(),
    latitude: z.coerce.number().refine(lat => lat >= -90 && lat <= 90, { message: "Latitude must be between -90 and 90" }),
    longitude: z.coerce.number().refine(lon => lon >= -180 && lon <= 180, { message: "Longitude must be between -180 and 180" }),
});

export const GetMapOutSchema = z.object({
    areaId: z.coerce.number(),
    sensors: z.array(MapSensorSchema).min(0),
    appSensors: z.array(AppMapSensorSchema).min(0),
});

export type MapSensor = z.infer<typeof MapSensorSchema>;
export type AppMapSensor = z.infer<typeof AppMapSensorSchema>;
export type GetMapOut = z.infer<typeof GetMapOutSchema>;