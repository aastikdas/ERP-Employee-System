import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-slate-800 rounded ${className}`}></div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3 border border-slate-900 bg-slate-950/20">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
};
