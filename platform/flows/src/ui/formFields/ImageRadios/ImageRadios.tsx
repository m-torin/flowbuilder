'use client';

import React, { useCallback } from 'react';
import { Radio, Group, rem, Button } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { UseFormReturnType } from '@mantine/form';
import { motion } from 'framer-motion';
import ImageRadio from './ImageRadio';
import { IconHelp } from '@tabler/icons-react';
import { IconProps } from '@tabler/icons-react';

export interface RadioItem {
  value: string;
  label: string;
  icon: React.ComponentType<IconProps>;
  helperText?: string;
}

export interface ImageRadiosProps {
  items?: RadioItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  form: UseFormReturnType<any>;
  disabled?: boolean;
}

export const ImageRadios = ({
  items = [],
  defaultValue,
  onChange,
  form,
  disabled = false,
}: ImageRadiosProps) => {
  const [_value, setValue] = useUncontrolled({
    value: form?.getValues().flowMethod,
    defaultValue,
    finalValue: '',
    onChange,
  });

  if (!form) {
    throw new Error('ImageRadios requires a form prop but got undefined.');
  }

  const handleChange = useCallback(
    (value: string) => {
      console.log(`Radio.Group onChange called with value: ${value}`);
      setValue(value);
      form.setFieldValue('flowMethod', value as any);
      form.validateField('flowMethod');
    },
    [setValue, form],
  );

  const radioVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Radio.Group
      name="flowMethod"
      label="Which method do you prefer?"
      description="You can change this later, don't worry!"
      withAsterisk
      tabIndex={1}
      value={_value}
      error={form.errors.flowMethod}
      onChange={handleChange}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
      >
        <Group mt="xs" gap="md">
          {items.map((item) => (
            <motion.div key={item.value} variants={radioVariants}>
              <ImageRadio
                item={item}
                isChecked={_value === item.value}
                setValue={setValue}
                form={form}
                disabled={disabled}
                iconComponent={item.icon}
              />
            </motion.div>
          ))}
          {/* Uncomment and adjust the Button if needed */}
          {/* <Button
            mb={rem(20)}
            leftSection={<IconHelp size={20} />}
            variant="subtle"
            color="blue"
            disabled={true || disabled}
          >
            Guide me
          </Button> */}
        </Group>
      </motion.div>
    </Radio.Group>
  );
};
