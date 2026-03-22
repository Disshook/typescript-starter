import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AtLeastOne } from '../../../common/validators/at-least-one.validator';

@InputType()
export class LoginWithEmailInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mobile?: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @AtLeastOne(['email', 'mobile'])
  _atLeastOne?: never;
}
