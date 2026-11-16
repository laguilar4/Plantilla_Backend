import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/metadata.constants';

/**
 * Marks a route (or controller) as exempt from guards that check for
 * the `isPublic` flag, e.g. ApiKeyGuard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
