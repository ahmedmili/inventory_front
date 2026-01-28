interface ArrowRightIconProps {
  className?: string;
}

export default function ArrowRightIcon({ className = 'w-5 h-5' }: ArrowRightIconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
