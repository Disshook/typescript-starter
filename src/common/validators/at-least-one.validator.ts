import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that at least one of the specified fields is non-empty.
 * Usage: @AtLeastOne(['email', 'mobile'])
 */
export function AtLeastOne(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOne',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      constraints: fields,
      options: {
        message: `At least one of [${fields.join(', ')}] must be provided`,
        ...validationOptions,
      },
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          return args.constraints.some(
            (field: string) =>
              obj[field] !== undefined &&
              obj[field] !== null &&
              obj[field] !== '',
          );
        },
      },
    });
  };
}
