import {
  Group,
  Button,
  UnstyledButton,
  Text,
  Divider,
  Center,
  Box,
  Burger,
  Drawer,
  Collapse,
  ScrollArea,
  rem,
  useMantineTheme,
  AppShell,
  Container,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import classes from './AppHeader.module.scss';
import { AppHeaderUserMenu } from './AppHeaderUserMenu';
import { AnimatedAnchorMemo } from '../Logo';
import { AppHeaderMenuBar, linkData } from './FlowsDropdown';

export const AppLayoutHeader = () => {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const theme = useMantineTheme();

  return (
    <Box>
      <AppShell.Header className={classes.header}>
        <Container size="lg" h="100%" px={{ base: '0', sm: rem(15) }}>
          <Group gap="sm" h="100%">
            <AnimatedAnchorMemo href="/" text="Flowbuilder" />
            <Divider size="xs" orientation="vertical" ml="sm" />

            <AppHeaderMenuBar />

            <Box style={{ flexGrow: 1 }} visibleFrom="sm" />
            <Box
              id="applayout-header-right-mobile"
              style={{ flexGrow: 1 }}
              hiddenFrom="sm"
            />

            <Box id="applayout-header-right-s1" visibleFrom="sm" />
            <Box id="applayout-header-right-s2" visibleFrom="sm" />

            <Divider size="xs" orientation="vertical" />
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="sm"
            />
            <Box visibleFrom="sm">
              <AppHeaderUserMenu />
            </Box>
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <Box>
          <AppHeaderUserMenu />
        </Box>

        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Box id="applayout-mobile-menu" />

          <Divider my="sm" />

          <Text className={classes.link} fw={700}>
            Global Navigation
          </Text>

          <a href="/" className={classes.link}>
            Dashboard
          </a>
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Flows
              </Box>
              <IconChevronDown
                style={{ width: rem(16), height: rem(16) }}
                color={theme.colors.cyan[6]}
              />
            </Center>
          </UnstyledButton>

          <Collapse in={linksOpened} ml={rem(15)}>
            {linkData.map((link, index) => (
              <Button key={index} component="a" href={link.href}>
                <link.icon /> {link.title}
              </Button>
            ))}
          </Collapse>

          <a href="/monitoring" className={classes.link}>
            Monitoring
          </a>
          <a href="/auditing" className={classes.link}>
            Auditing
          </a>

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            <Button variant="default">Log in</Button>
            <Button>Sign up</Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
};
