# SHARKVISION Interactive Marks Simulator — Iteration 5

## 1. Overview
The **Marks Recovery Simulator** provides candidates with an interactive, deterministic counterfactual tool to evaluate the mathematical consequences of their answer modifications.

## 2. Modes Supported

### Mode A: Global First-Answer Scenario
Calculates score if every initial option selection had been preserved:
$$\text{SimulatedTotal} = \sum_{q} \text{FirstAnswerScore}_q$$
$$\text{NetDelta} = \text{SimulatedTotal} - \text{ActualTotal}$$

### Mode B: Interactive Per-Question Reversion
Allows students to toggle individual questions between their first recorded choice and final submission to pinpoint specific point gains or losses.

### Mode C: Review Answer Changes
Isolates questions where answer revisions increased marks (`INCORRECT_TO_CORRECT`), decreased marks (`CORRECT_TO_INCORRECT`), or had zero net mark impact (`CORRECT_TO_CORRECT` / `INCORRECT_TO_INCORRECT`).

## 3. Strict Security & Non-Destructive Invariance
- Pure counterfactual calculation: The underlying official examination score and graded database record remain immutable.
- Results release enforcement: Gated until official results release policy permits access.
