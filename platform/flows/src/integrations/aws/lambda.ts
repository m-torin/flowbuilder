// src/integrations/aws/compute.ts
// 'use server';

import {
  Lambda,
  ListFunctionsCommand,
  FunctionConfiguration,
} from '@aws-sdk/client-lambda';

import { CONFIG } from './config';

const lambda = new Lambda(CONFIG);

export interface LambdaFunction {
  name: string;
  arn: string;
}

export async function fetchLambdaFunctions(): Promise<LambdaFunction[]> {
  try {
    const command = new ListFunctionsCommand({});
    const response = await lambda.send(command);

    return (response.Functions || [])
      .filter(
        (
          fn,
        ): fn is FunctionConfiguration & {
          FunctionName: string;
          FunctionArn: string;
        } => Boolean(fn.FunctionName && fn.FunctionArn),
      )
      .map((fn) => ({
        name: fn.FunctionName,
        arn: fn.FunctionArn,
      }));
  } catch (error) {
    console.error('Error fetching Lambda functions:', error);
    throw error;
  }
}
