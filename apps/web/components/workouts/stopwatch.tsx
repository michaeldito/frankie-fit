"use client";

import { useEffect, useRef, useState } from "react";
import { formatSeconds } from "@frankie-fit/workout-core";

type StopwatchProps = {
  onChange: (value: string) => void;
  value: string;
};

export function Stopwatch({ onChange, value }: StopwatchProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    startRef.current = Date.now() - elapsedMs;
    const intervalId = setInterval(() => {
      setElapsedMs(Date.now() - (startRef.current ?? Date.now()));
    }, 250);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  function handleStartStop() {
    setIsRunning((running) => !running);
  }

  function handleReset() {
    setIsRunning(false);
    setElapsedMs(0);
  }

  function handleUseThisTime() {
    onChange(formatSeconds(Math.round(elapsedMs / 1000)));
  }

  return (
    <div className="ff-card-soft flex flex-wrap items-center gap-3 p-3">
      <span className="min-w-[4.5rem] font-mono text-lg">
        {formatSeconds(Math.round(elapsedMs / 1000))}
      </span>
      <button
        className="ff-button-secondary cursor-pointer px-3 py-2 text-sm"
        onClick={handleStartStop}
        type="button"
      >
        {isRunning ? "Stop" : "Start"}
      </button>
      <button className="ff-button-secondary cursor-pointer px-3 py-2 text-sm" onClick={handleReset} type="button">
        Reset
      </button>
      <button
        className="ff-button-secondary cursor-pointer px-3 py-2 text-sm"
        onClick={handleUseThisTime}
        type="button"
      >
        Use this time
      </button>
      <input
        className="ff-input w-28"
        onChange={(event) => onChange(event.target.value)}
        placeholder="mm:ss"
        type="text"
        value={value}
      />
    </div>
  );
}
