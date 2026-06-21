"use client";

import { Skeleton } from "primereact/skeleton";

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({
  width = "100%",
  height = "1rem",
  className,
}: SkeletonLineProps): React.ReactElement {
  return <Skeleton width={width} height={height} className={className} />;
}

interface SkeletonBlockProps {
  width?: string;
  height?: string;
  className?: string;
  borderRadius?: string;
}

export function SkeletonBlock({
  width = "100%",
  height = "120px",
  className,
  borderRadius = "8px",
}: SkeletonBlockProps): React.ReactElement {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={className}
    />
  );
}

interface SkeletonCircleProps {
  size?: string;
  className?: string;
}

export function SkeletonCircle({
  size = "3rem",
  className,
}: SkeletonCircleProps): React.ReactElement {
  return <Skeleton shape="circle" size={size} className={className} />;
}
