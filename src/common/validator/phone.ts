import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function Phone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIranianPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return /^09\d{9}$/.test(value); 
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Iranian phone number (09xxxxxxxxx)`;
        },
      },
    });
  };
}