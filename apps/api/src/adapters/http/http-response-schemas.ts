import { z } from 'zod';

export const httpErrorResponseSchema = z.object({
  message: z.string(),
});

export type HttpErrorResponse = z.infer<typeof httpErrorResponseSchema>;

