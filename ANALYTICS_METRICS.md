# SHARKVISION Analytics Metric Formulas & Definitions

## 1. Score & Accuracy Formulas

### Marks Obtained
$$\text{MarksObtained} = \sum_{q \in \text{AttemptedCorrect}} \text{Marks}_q - \sum_{q \in \text{AttemptedIncorrect}} \text{NegativeMarks}_q$$

### Maximum Marks
$$\text{MaxMarks} = \sum_{q \in \text{AllQuestions}} \text{Marks}_q$$

### Percentage Score
$$\text{PercentageScore} = \frac{\text{MarksObtained}}{\text{MaxMarks}} \times 100$$
*(Note: Can be negative when negative penalties exceed positive marks)*

### Accuracy Percentage
$$\text{AccuracyPercentage} = \begin{cases} \frac{\text{CorrectAnswers}}{\text{AttemptedQuestions}} \times 100 & \text{if AttemptedQuestions} > 0 \\ \text{null} & \text{if AttemptedQuestions} = 0 \end{cases}$$

---

## 2. Timing Metrics

### Active Dwell Time
$$\text{TotalActiveTime}_q = \sum_{i \in \text{Visits}_q} (\text{ExitMonoTimestamp}_i - \text{EnterMonoTimestamp}_i)$$
*(Excludes background and hidden tab durations)*

### Time Above Benchmark
$$\text{TimeDelta}_q = \text{ActiveTimeSeconds}_q - \text{BenchmarkSeconds}_q$$
*(Only computed when BenchmarkSeconds is defined; otherwise classified as UNKNOWN)*

---

## 3. Answer Change Impact

### Marks Gained From Changes
$$\text{MarksGained} = \sum_{q} \max(0, \text{ActualScore}_q - \text{FirstAnswerScore}_q)$$

### Marks Lost From Changes
$$\text{MarksLost} = \sum_{q} \max(0, \text{FirstAnswerScore}_q - \text{ActualScore}_q)$$

### Net Answer Change Impact
$$\text{NetImpact} = \text{MarksGained} - \text{MarksLost}$$
