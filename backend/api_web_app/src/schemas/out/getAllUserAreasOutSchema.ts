import z from "zod";

export const GetAllUserAreasItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  url: z.string(),
  latitude: z.coerce
    .number()
    .refine((lat) => lat >= -90 && lat <= 90, {
      message: "Latitude must be between -90 and 90",
    }),
  longitude: z.coerce
    .number()
    .refine((lon) => lon >= -180 && lon <= 180, {
      message: "Longitude must be between -180 and 180",
    }),
});

export const GetAllUserAreasOutSchema = z.object({
  areas: z.array(GetAllUserAreasItemSchema),
});

export type GetAllUserAreasItem = z.infer<typeof GetAllUserAreasItemSchema>;
export type GetAllUserAreasOut = z.infer<typeof GetAllUserAreasOutSchema>;
