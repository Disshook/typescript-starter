import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { AtLeastOne } from '../../../common/validators/at-least-one.validator';

@InputType()
export class LoginWithMobileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid mobile number format' })
  mobile?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @AtLeastOne(['email', 'mobile'])
  _atLeastOne?: never;
}
