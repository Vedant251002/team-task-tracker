import { z } from 'zod';
import { Role } from '../../domain/enums';

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role, { required_error: 'Role is required' }),
});
