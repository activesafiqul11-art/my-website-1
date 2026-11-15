import { z } from 'zod';

export const contactSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 characters).')
    .max(120, 'Name is too long.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(160, 'Email address is too long.'),
  subject: z
    .string()
    .trim()
    .min(3, 'Please enter a subject (at least 3 characters).')
    .max(180, 'Subject is too long.'),
  message: z
    .string()
    .trim()
    .min(10, 'Please enter a message (at least 10 characters).')
    .max(3000, 'Message cannot exceed 3,000 characters.'),
  website: z.string().optional().default(''),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
