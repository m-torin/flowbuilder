'use client';

import React, { FC, memo, useCallback, useMemo } from 'react';
import { FbNodeProps } from '#/flows/types';
import { useFbNode } from '#/flows/nodes/internal';
import { NodeWrapper } from '#/flows/nodes/internal';
import { formSchema, FormValues } from './formSchema';
import { getInitialValues } from './initialValues';
import { NodeForm, NodeOptions } from './ui';
import { metaIfElseThenNode } from './metadata';
import { handleSubmit } from './handleSubmit';
import { computeWrapper } from './computeEvent';

/**
 * IfElseThenNode Component
 * A functional component that handles the rendering and logic for a source node.
 *
 * Features:
 * - Form handling with validation
 * - Computation wrapper for processing data
 * - Integration with node framework
 *
 * @component
 * @param {FbNodeProps} props - Component properties following the FbNodeProps interface
 */
export const IfElseThenNode: FC<FbNodeProps> = memo((props: FbNodeProps) => {
  const { data } = props;

  /**
   * Memoized initial values for the form
   * Recalculates only when node data changes
   */
  const initialValues = useMemo(() => getInitialValues(data), [data]);

  /**
   * Form submission handler
   * Validates form data and processes the submission
   *
   * @param {FormValues} values - The form values to be submitted
   */
  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      // Validate form values against schema
      const validation = formSchema.safeParse(values);
      if (!validation.success) {
        console.error('Form validation failed:', validation.error);
        return;
      }

      // Process form submission
      const result = await handleSubmit(values);
      if (!result.success && result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      throw error;
    }
  }, []);

  /**
   * Memoized node properties configuration
   * Combines form handling, compute functionality, and UI components
   */
  const fbNodeProps = useMemo(
    () => ({
      node: {
        nodeProps: props,
        nodeMeta: metaIfElseThenNode,
      },
      form: {
        formSchema,
        initialValues,
        handleSubmit: onSubmit,
      },
      compute: computeWrapper,
      modalTabs: {
        configuration: NodeForm,
        nodeOptions: NodeOptions,
      },
    }),
    [props, initialValues, onSubmit],
  );

  // Initialize node with form values type
  const { CombinedProviderComponent } = useFbNode<FormValues>(fbNodeProps);

  // Guard clause for missing data
  if (!data) {
    console.error('Node data is missing');
    return null;
  }

  return (
    <CombinedProviderComponent>
      <NodeWrapper />
    </CombinedProviderComponent>
  );
});

// Set display name for debugging purposes
IfElseThenNode.displayName = 'IfElseThenNode';
