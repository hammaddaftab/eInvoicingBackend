import { z } from 'zod';
import { Emirate } from './src/entities/enums';

const schema = z.enum(Emirate);
