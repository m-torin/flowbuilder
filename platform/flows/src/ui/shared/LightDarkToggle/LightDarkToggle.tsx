import cx from 'clsx';
import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Group,
} from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import classes from './LightDarkToggle.module.scss';

export const LightDarkToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')
        }
        variant="default"
        size="xl"
        aria-label="Toggle color scheme"
        style={{ border: 'none' }}
      >
        <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
      </ActionIcon>
    </Group>
  );
};
