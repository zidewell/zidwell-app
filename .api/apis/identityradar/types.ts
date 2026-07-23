import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type GettingStartedWithYourApiBodyParam = FromSchema<typeof schemas.GettingStartedWithYourApi.body>;
export type GettingStartedWithYourApiMetadataParam = FromSchema<typeof schemas.GettingStartedWithYourApi.metadata>;
export type GettingStartedWithYourApiResponse200 = FromSchema<typeof schemas.GettingStartedWithYourApi.response['200']>;
export type GettingStartedWithYourApiResponse400 = FromSchema<typeof schemas.GettingStartedWithYourApi.response['400']>;
