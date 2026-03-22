import { InputType, Field } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

/**
 * Register Input DTO
 *
 * Input type for user registration.
 * Extends CreateUserInput with the same validation rules.
 * Separated to allow for future registration-specific fields
 * (e.g., terms acceptance, referral code, etc.)
 *
 * Requirements:
 * - 4.5: Validate firstName and lastName are 1-100 characters
 * - 4.6: Validate email is valid format
 * - 9.5: Validate email field matches valid email format
 * - 9.6: Validate password is minimum 8 characters with uppercase, lowercase, and number
 * - 9.7: Validate field values don't exceed maximum length constraints
 */
@InputType()
export class RegisterInput extends CreateUserInput {
  // Currently inherits all fields from CreateUserInput
  // Future registration-specific fields can be added here
  // Example:
  // @Field(() => Boolean, { description: 'Accept terms and conditions' })
  // @IsBoolean()
  // acceptTerms: boolean;
}
