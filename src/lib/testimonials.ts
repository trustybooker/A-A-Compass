// Social proof slot. POLICY: only real quotes from real users who gave
// written permission may ever be added here — fabricated testimonials would
// violate the product's core honesty rules (docs/AA_Compass_v5_Skill_System_Prompt.md).
// The landing section renders only when this list is non-empty.

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [];
