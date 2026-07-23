import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiZap } from 'react-icons/fi';

/**
 * Inline upgrade prompt for free-plan users hitting Pro features.
 */
export default function UpgradeGate({
  feature = 'This feature',
  compact = false,
  className = '',
}) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 ${className}`}
      >
        <FiLock size={14} className="flex-shrink-0" />
        <span className="flex-1">{feature} is on Pro.</span>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="font-medium text-[#168eea] hover:underline"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm ${className}`}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#168eea]/10">
        <FiLock className="text-[#168eea]" size={22} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature} is a Pro feature</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
        Free plans include core posting and scheduling. Upgrade to Pro to unlock AI Studio, the
        writing assistant, and advanced idea generation.
      </p>
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-medium rounded-lg text-sm"
      >
        <FiZap size={16} />
        View plan in Settings
      </button>
    </div>
  );
}
