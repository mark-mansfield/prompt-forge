import { Crown } from 'lucide-react';
import { Button } from '../ui/button';

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
    <Button
      variant="outline"
      size="lg"
      className="rounded-none w-full font-bold text-lg p-4 transition-all duration-200 bg-white/10 hover:bg-white/20 border-white/20"
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
    </Button>
  );
};
