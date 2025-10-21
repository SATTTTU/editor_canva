import { Line } from 'react-konva';

interface GuideLineProps {
  snapPoint: number;
  orientation: 'vertical' | 'horizontal';
  stageWidth: number;
  stageHeight: number;
}

export function GuideLine({ snapPoint, orientation, stageWidth, stageHeight }: GuideLineProps) {
  const isVertical = orientation === 'vertical';
  
  return (
    <Line
      points={
        isVertical
          ? [snapPoint, 0, snapPoint, stageHeight]
          : [0, snapPoint, stageWidth, snapPoint]
      }
      stroke="#00ff00"
      strokeWidth={1}
      dash={[4, 4]}
      opacity={0.5}
    />
  );
}