interface VerificationBadgeProps {
  status: string;
  className?: string;
}

export default function VerificationBadge({ status, className = "" }: VerificationBadgeProps) {
  if (status === "VERIFIED_OFFICIAL") {
    return (
      <span className={`px-2 py-1 bg-verified-blue text-white text-xs rounded-full ${className}`}>
        <i className="fas fa-shield-alt mr-1"></i>Verified
      </span>
    );
  }
  
  if (status === "UNVERIFIED_CONSERVATIVE") {
    return (
      <span className={`px-2 py-1 bg-warning-orange text-white text-xs rounded-full ${className}`}>
        <i className="fas fa-exclamation-triangle mr-1"></i>Unverified
      </span>
    );
  }
  
  return (
    <span className={`px-2 py-1 bg-gray-500 text-white text-xs rounded-full ${className}`}>
      <i className="fas fa-question-circle mr-1"></i>Review Needed
    </span>
  );
}
