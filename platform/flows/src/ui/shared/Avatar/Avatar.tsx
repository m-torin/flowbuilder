'use client';

import Link from 'next/link';
import styles from './Avatar.module.scss';
import {
  Box,
  Group,
  Avatar as MantineAvatar,
  AvatarProps as MantineAvatarProps,
} from '@mantine/core';

interface AvatarProps extends MantineAvatarProps {
  imgUri: string;
  altTag: string;
  children?: React.ReactNode;
}

const AvatarContent: React.FC<{
  imgUri: string;
  altTag: string;
  rest: Omit<MantineAvatarProps, 'src' | 'alt' | 'component'>;
}> = ({ imgUri, altTag, rest }) => (
  <Box className={styles.circle}>
    <MantineAvatar
      src={imgUri}
      alt={altTag}
      className={styles.image}
      {...rest}
    />
  </Box>
);

export const Avatar: React.FC<AvatarProps> = ({
  imgUri,
  altTag,
  children,
  ...rest
}) => (
  <>
    {children ? (
      <Group className={styles.group}>
        <AvatarContent imgUri={imgUri} altTag={altTag} rest={rest} />
        {children}
      </Group>
    ) : (
      <AvatarContent imgUri={imgUri} altTag={altTag} rest={rest} />
    )}
  </>
);

export default Avatar;
