import { z } from 'zod';

export const searchSchema = z.object({
  origin:      z.string().min(1, 'Select an origin'),
  destination: z.string().min(1, 'Select a destination'),
  date:        z.string().min(1, 'Select a date'),
  passengers:  z.number().min(1).max(6),
}).refine(d => d.origin !== d.destination, {
  message: 'Origin and destination cannot be the same',
  path: ['destination'],
});

export const passengerSchema = z.object({
  full_name:   z.string().min(2, 'Name must be at least 2 characters'),
  passport_no: z.string().min(5, 'Enter a valid passport number'),
  nationality: z.string().min(2, 'Nationality is required'),
  dob:         z.string().refine(d => new Date(d) < new Date(), {
    message: 'Date of birth must be in the past',
  }),
});