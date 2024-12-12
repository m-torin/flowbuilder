import { prisma } from '#/lib/prisma/client';
import { Prisma, User } from '@prisma/client';

/**
 * Fetches a user by their unique identifier.
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<User | null>} - A promise that resolves to the user or null if not found.
 */
export const readUser = async (userId: string): Promise<User | null> => {
  try {
    // const user = await prisma.user.findUnique({
    //     where: { id: userId },
    // });
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    console.log('Asked prisma for user:', user);
    return user;
  } catch (error) {
    console.error('Error in readUser:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Updates a user's details.
 * @param {string} userId - The unique identifier of the user.
 * @param {Prisma.UserUpdateInput} data - The data to update the user with.
 * @returns {Promise<User | null>} - A promise that resolves to the updated user or null if not found.
 */
export const updateUser = async (
  userId: string,
  data: Prisma.UserUpdateInput,
): Promise<User | null> => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return updatedUser;
  } catch (error) {
    console.error('Error in updateUser:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
};
