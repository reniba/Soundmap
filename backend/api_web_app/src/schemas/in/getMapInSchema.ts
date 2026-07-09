import z from "zod";

export const GetMapInSchema = z.object({
    areaId: z.coerce.number().int().positive()
});

export type GetMapIn = z.infer<typeof GetMapInSchema>;