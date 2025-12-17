'use client';

import Link from 'next/link';
import { Button, Container, Text, Title, Stack } from '@mantine/core';

export default function FlowNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <Title order={1}>Flow Not Found</Title>
        <Text c="dimmed" size="lg" ta="center">
          The flow you're looking for doesn't exist or has been deleted.
        </Text>
        <Button component={Link} href="/flows" variant="light">
          Back to Flows
        </Button>
      </Stack>
    </Container>
  );
}

