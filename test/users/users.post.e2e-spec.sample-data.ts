import { faker } from '@faker-js/faker';

/**
 * Generates a valid user payload with all required fields.
 */
export function validUserPayload() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'P@ssw0rd!23',
  };
}

/**
 * Generates a user payload missing the firstName field.
 */
export function userWithMissingFirstName() {
  return {
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'P@ssw0rd!23',
  };
}

/**
 * Generates a user payload with an invalid email format.
 */
export function userWithInvalidEmail() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: 'invalid-email-no-domain',
    password: 'P@ssw0rd!23',
  };
}

/**
 * Generates a user payload with a weak password.
 */
export function userWithWeakPassword() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'weak',
  };
}

/**
 * Generates a user payload missing the email field.
 */
export function userWithMissingEmail() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: 'P@ssw0rd!23',
  };
}

/**
 * Generates a user payload missing the password field.
 */
export function userWithMissingPassword() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
  };
}

/**
 * Generates random user data using Faker v9.
 */
export function generateRandomUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'P@ssw0rd!23',
  };
}
