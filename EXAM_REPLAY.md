# SHARKVISION Exam Replay Engine — Iteration 5

## 1. Overview
The **Exam Replay Engine** allows candidates, authorized teachers, and parents to chronologically step through or play back the exact sequence of actions taken during an examination.

## 2. Replay Engineering & Integrity
- **No Screen/Video Captures**: Reconstruction is 100% event-driven, derived from the append-only `attempt_events` table and client sequence counters.
- **Privacy & Security**: Zero mouse movements, audio, or out-of-exam browsing activities are tracked or recorded.
- **Monotonic Sequence Enforcement**: Events are sorted by `client_sequence_num` and verified against server timestamps.
- **Answer State Reconstruction**: Reconstructs option selection at every point in time (e.g. `00:10 Q1 opened -> 00:35 Option B selected -> 01:40 Q1 revisited -> 02:00 changed from B to D`).
- **Answer Key Masking**: If the examination result release policy is pending (e.g. `AFTER_DEADLINE` with active window), correct keys and solution explanations remain hidden.

## 3. Playback Controls
- **Scrubber**: Clickable range input allowing instant timeline positioning.
- **Speed Multipliers**: Supports `1x`, `2x`, and `4x` playback rates.
- **Event Feed Jump**: Direct selection of any action jumps the cursor immediately.
