import type { Signal } from "@preact/signals";
import { Button } from "../components/ui/Button.tsx";

interface CounterProps {
  count: Signal<number>;
}

export default function Counter(props: CounterProps) {
  const decrement = () => {
    props.count.value -= 1;
  };

  const increment = () => {
    props.count.value += 1;
  };

  return (
    <div class="flex gap-8 py-6">
      <Button onClick={decrement}>-1</Button>
      <p class="text-3xl tabular-nums">{props.count}</p>
      <Button onClick={increment}>+1</Button>
    </div>
  );
}
