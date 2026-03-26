import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
  type?: "submit" | "resolved";
}

const ConfettiCelebration = ({ trigger, type = "submit" }: Props) => {
  useEffect(() => {
    if (!trigger) return;

    if (type === "resolved") {
      // Green celebration for resolved
      const end = Date.now() + 2000;
      const colors = ["#16a34a", "#22c55e", "#4ade80", "#86efac"];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      // Rainbow burst for submission
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"],
      });
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
      }, 300);
    }
  }, [trigger, type]);

  return null;
};

export default ConfettiCelebration;
