'use client';

import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

export const NewFlowButton = () => {
  return (
    <Button
      leftSection={<IconPlus size={16} />}
      variant="light"
      color="blue.8"
      component={Link}
      href="/flows/new"
    >
      New Flow
    </Button>
  );
};

