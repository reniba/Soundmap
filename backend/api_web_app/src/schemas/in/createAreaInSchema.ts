import z from "zod";

export const CreateAreaInSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    latitude: z.coerce.number().refine(lat => lat >= -90 && lat <= 90, { message: "Latitude must be between -90 and 90" }),
    longitude: z.coerce.number().refine(lon => lon >= -180 && lon <= 180, { message: "Longitude must be between -180 and 180" }),
    url: z.url("URL inválida")
});

export type CreateAreaIn = z.infer<typeof CreateAreaInSchema>;
