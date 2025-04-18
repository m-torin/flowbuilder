// PythonEditorNode/handleSubmit.ts
import { FormValues } from './formSchema';

type SubmitResult = {
  success: boolean;
  message?: string;
  error?: Error;
};

export const handleSubmit = async (
  values: FormValues,
): Promise<SubmitResult> => {
  try {
    // Validate code is present
    if (!values.metadata?.code?.trim()) {
      throw new Error('Code cannot be empty');
    }

    // Here you could add:
    // - Code validation/linting
    // - Save to backend
    // - Update node state
    // - Trigger compute

    return {
      success: true,
      message: 'Code saved successfully',
    };
  } catch (error) {
    console.error('Python Editor submission failed:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
};
