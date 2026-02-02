import { Crown } from 'lucide-react';
export const WinnerButton = ({
  label,
  onClick,
  isWinner,
}: {
  label: string;
  onClick: () => void;
  isWinner: boolean;
}) => {
  return (
    <button
      className="p-4 font-bold text-lg w-full transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
      onClick={onClick}
    >
      {isWinner ? (
        <>
          <Crown className="w-5 h-5 text-yellow-400" />
          WINNER
        </>
      ) : (
        `Make ${label} Winner`
      )}
    </button>
  );
};
