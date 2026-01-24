export const typewriterEffect = (
  fullText: string,
  indexRef: React.MutableRefObject<number>,
  setter: React.Dispatch<React.SetStateAction<string>>,
  speed: number = 15
) => {
  const interval = setInterval(() => {
    if (indexRef.current < fullText.length) {
      setter(fullText.slice(0, indexRef.current + 1));
      indexRef.current++;
    } else {
      clearInterval(interval);
    }
  }, speed);
  return interval;
};
