"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { ExamEventType } from "@/types/database";

export interface PendingEvent {
  attemptId: string;
  questionId?: string | null;
  eventType: ExamEventType;
  clientSequenceNum: number;
  idempotencyKey: string;
  clientTimestamp: string;
  payload: Record<string, unknown>;
  clientSessionId: string;
}

export function useExamTimerAndEvents({
  attemptId,
  currentQuestionId,
  serverDeadline,
  onAutoSubmit,
}: {
  attemptId: string;
  currentQuestionId: string | null;
  serverDeadline: string;
  onAutoSubmit: () => void;
}) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<"SAVED" | "SAVING" | "OFFLINE" | "ERROR">("SAVED");

  // Monotonic tracking references
  const activeQuestionStartMs = useRef<number>(performance.now());
  const cumulativeQuestionTimeMs = useRef<Record<string, number>>({});
  const clientSeqNum = useRef<number>(0);
  const sessionId = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sess_${Math.random()}`
  );
  const pendingEventsQueue = useRef<PendingEvent[]>([]);
  const isFlushing = useRef<boolean>(false);

  // 1. Authoritative Server Deadline Countdown
  useEffect(() => {
    const deadlineTime = new Date(serverDeadline).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      setSecondsRemaining(diffSec);

      if (diffSec <= 0) {
        onAutoSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [serverDeadline, onAutoSubmit]);

  // 2. Dispatch Exam Event with local offline queuing & idempotency
  const dispatchEvent = useCallback(
    async (eventType: ExamEventType, questionId?: string | null, payload: Record<string, unknown> = {}) => {
      clientSeqNum.current += 1;
      const idempotencyKey = `${attemptId}_${clientSeqNum.current}_${Date.now()}`;

      const event: PendingEvent = {
        attemptId,
        questionId: questionId || currentQuestionId,
        eventType,
        clientSequenceNum: clientSeqNum.current,
        idempotencyKey,
        clientTimestamp: new Date().toISOString(),
        payload,
        clientSessionId: sessionId.current,
      };

      pendingEventsQueue.current.push(event);
      flushEventQueue();
    },
    [attemptId, currentQuestionId]
  );

  // 3. Flush Event Queue
  const flushEventQueue = useCallback(async () => {
    if (isFlushing.current || pendingEventsQueue.current.length === 0) return;
    isFlushing.current = true;

    while (pendingEventsQueue.current.length > 0) {
      const event = pendingEventsQueue.current[0];
      try {
        const res = await fetch("/api/exam/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });

        if (!res.ok && res.status !== 409) {
          setSyncStatus("OFFLINE");
          break;
        }

        // Successfully processed or deduplicated
        pendingEventsQueue.current.shift();
        setSyncStatus("SAVED");
      } catch (err) {
        setSyncStatus("OFFLINE");
        break;
      }
    }
    isFlushing.current = false;
  }, []);

  // 4. Cumulative Active Monotonic Timing on Question Switch / Visited
  const recordQuestionExit = useCallback(
    (qId: string) => {
      const now = performance.now();
      const elapsed = Math.max(0, now - activeQuestionStartMs.current);
      cumulativeQuestionTimeMs.current[qId] = (cumulativeQuestionTimeMs.current[qId] || 0) + elapsed;
      dispatchEvent("QUESTION_LEFT", qId, {
        dwellMs: elapsed,
        cumulativeMs: cumulativeQuestionTimeMs.current[qId],
      });
    },
    [dispatchEvent]
  );

  const recordQuestionEnter = useCallback(
    (qId: string, isRevisit: boolean) => {
      activeQuestionStartMs.current = performance.now();
      dispatchEvent(isRevisit ? "QUESTION_REVISITED" : "QUESTION_OPENED", qId, {
        cumulativePriorMs: cumulativeQuestionTimeMs.current[qId] || 0,
      });
    },
    [dispatchEvent]
  );

  // 5. Handle Tab Visibility (Stop timer on hidden, resume on visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: close current active interval
        if (currentQuestionId) {
          const now = performance.now();
          const elapsed = Math.max(0, now - activeQuestionStartMs.current);
          cumulativeQuestionTimeMs.current[currentQuestionId] =
            (cumulativeQuestionTimeMs.current[currentQuestionId] || 0) + elapsed;
          dispatchEvent("TAB_HIDDEN", currentQuestionId, { dwellMs: elapsed });
        }
      } else {
        // Tab returned to visible: resume monotonic clock
        activeQuestionStartMs.current = performance.now();
        if (currentQuestionId) {
          dispatchEvent("TAB_VISIBLE", currentQuestionId);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", flushEventQueue);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", flushEventQueue);
    };
  }, [currentQuestionId, dispatchEvent, flushEventQueue]);

  const getQuestionActiveTimeMs = (qId: string) => {
    const base = cumulativeQuestionTimeMs.current[qId] || 0;
    if (qId === currentQuestionId && !document.hidden) {
      return base + Math.max(0, performance.now() - activeQuestionStartMs.current);
    }
    return base;
  };

  const setInitialQuestionTime = (qId: string, initialMs: number) => {
    if (cumulativeQuestionTimeMs.current[qId] === undefined) {
      cumulativeQuestionTimeMs.current[qId] = initialMs;
    }
  };

  return {
    secondsRemaining,
    syncStatus,
    setSyncStatus,
    dispatchEvent,
    recordQuestionEnter,
    recordQuestionExit,
    getQuestionActiveTimeMs,
    setInitialQuestionTime,
  };
}
