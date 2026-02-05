"use client";

interface DoneModalProps {
  onWatchOtherVideo: () => void;
}

export default function DoneModal({ onWatchOtherVideo }: DoneModalProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-gradient-to-br from-blue-600 to-purple-600 p-4 text-center sm:space-y-8 sm:p-6">
      {/* Celebration Icon */}
      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-yellow-400 shadow-2xl sm:h-40 sm:w-40">
        <svg
          className="h-20 w-20 text-white sm:h-24 sm:w-24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Celebration Message */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
          Well Done!
        </h2>
        <p className="text-xl text-white/90 sm:text-2xl">
          See you next time! 👋
        </p>
      </div>

      {/* Watch Other Video button */}
      <button
        onClick={onWatchOtherVideo}
        className="rounded-full bg-white px-10 py-3 text-base font-bold text-blue-600 shadow-2xl transition-all active:scale-95 sm:px-12 sm:py-4 sm:text-lg sm:hover:scale-105"
      >
        Watch Other Video
      </button>
    </div>
  );
}
