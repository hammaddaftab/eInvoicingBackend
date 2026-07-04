import { z } from 'zod';
import { Emirate } from './src/entities/enums';

try {
  const schema = z.enum(Emirate as any); // Let's check how z.enum expects it
  console.log("Works with z.enum(Emirate as any)");
} catch(e) {
  console.error("Failed", e);
}
