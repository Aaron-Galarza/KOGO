import { z } from 'zod';

export const UserLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;
