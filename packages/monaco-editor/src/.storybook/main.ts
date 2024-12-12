// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

export default {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    'storybook-addon-mantine',
    'storybook-dark-mode',
  ],
  framework: '@storybook/react-vite',
} satisfies StorybookConfig;
