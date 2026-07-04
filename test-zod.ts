import { z, ZodError } from 'zod';
const schema = z.object({ a: z.string() });
try {
  schema.parse({});
} catch (e) {
  if (e instanceof ZodError) {
    console.log(e.issues);
  }
}
