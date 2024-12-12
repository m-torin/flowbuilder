'use server';

import { Prisma, User } from '@prisma/client';
import { readUser, updateUser } from '#/lib/prisma/ormApi';

/**
 * Fetches a user by their unique identifier.
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<User | null>} - A promise that resolves to the user or null if not found.
 */
export const readUserAction = async (userId: string): Promise<User | null> => {
  console.log('readUserAction', userId);
  try {
    const user = await readUser(userId);
    console.log('Fetched user:', user);
    return user;
  } catch (error) {
    console.error('Error in readUserAction:', error);
    return null;
  }
};

/**
 * Updates a user's details.
 * @param {string} userId - The unique identifier of the user.
 * @param {Prisma.UserUpdateInput} data - The data to update the user with.
 * @returns {Promise<User | null>} - A promise that resolves to the updated user or null if not found.
 */
export const updateUserAction = async (
  userId: string,
  data: Prisma.UserUpdateInput,
): Promise<User | null> => {
  console.log('updateUserAction', userId, JSON.stringify(data));
  try {
    const updatedUser = await updateUser(userId, data);
    return updatedUser;
  } catch (error) {
    console.error('Error in updateUserAction:', error);
    return null;
  }
};
