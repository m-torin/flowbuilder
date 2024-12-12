import type { StorybookConfig } from '@storybook/react-vite';

import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('storybook-addon-mantine'),
    getAbsolutePath('storybook-dark-mode'),
    getAbsolutePath('@storybook/preview-api'),
    getAbsolutePath('storybook-addon-pseudo-states'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config, { configType }) => {
    // Add .css to the extensions if it's not already included
    if (!config?.resolve?.extensions?.includes('.css')) {
      config?.resolve?.extensions?.push('.css');
    }

    // Configure CSS modules
    config.css = {
      modules: {
        generateScopedName: '[name]__[local]___[hash:base64:5]',
        ...(config.css?.modules || {}),
      },
      ...(config.css || {}),
    };

    return config;
  },
};
export default config;
