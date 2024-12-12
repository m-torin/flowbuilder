import { rem } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Controls, ControlButton } from '@xyflow/react';

export const CustomControls = () => {
  return (
    <Controls style={{ marginBottom: rem(80) }}>
      <ControlButton
        onClick={() => console.log('undo')}
        title="undo"
        // disabled={!canUndo}
      >
        <IconArrowBackUp size={20} />
      </ControlButton>
      <ControlButton
        onClick={() => console.log('undo')}
        title="redo"
        // disabled={!canRedo}
      >
        <IconArrowForwardUp size={20} />
      </ControlButton>
    </Controls>
  );
};
