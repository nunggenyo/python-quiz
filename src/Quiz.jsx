import { useEffect, useState } from "react";
import "./quiz.css";

const STORAGE_KEY = "quiz_progress";
const COMPLETED_KEY = "quiz_completed";

// ─── LocalStorage helpers ────────────────────────────────────────────────────
const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveProgress = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const loadCompleted = () => {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCompleted = (completedMap) => {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedMap));
  } catch {}
};
// ─────────────────────────────────────────────────────────────────────────────

export default function Quiz() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [data, setData] = useState(null);
  const [processedQuestions, setProcessedQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resumeData, setResumeData] = useState(null);      // pending resume info
  const [completedSets, setCompletedSets] = useState({});  // { "day1-set2": "95%" }

  const dayConfigs = {
    day1: { sets: [1, 2, 3, 4, 5], title: "Day 1", subtitle: "Software Design and Development" },
    day2: { sets: [1, 2, 3, 4, 5], title: "Day 2", subtitle: "Programming Basics - 1 (Python)" },
    day3: { sets: [1, 2, 3, 4, 5], title: "Day 3", subtitle: "Programming Basics - 2 (Python)" },
    day4: { sets: [1, 2, 3, 4, 5], title: "Day 4", subtitle: "Object Oriented Programming - 1 (Python)" },
    day5: { sets: [1, 2, 3, 4, 5], title: "Day 5", subtitle: "Object Oriented Programming - 1 (Python)" },
    day6: { sets: [1, 2, 3, 4, 5], title: "Day 6", subtitle: "Web Design & Development Fundamentals (Front-End) - 1" }
  };

  // Sync resumeData and completedSets from localStorage whenever the main menu is shown
  useEffect(() => {
    if (selectedDay === null) {
      setCompletedSets(loadCompleted());
      const saved = loadProgress();
      setResumeData(saved || null);
    }
  }, [selectedDay]);

  // Shuffle utility
  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Persist progress whenever quiz state changes (only while a quiz is active)
  useEffect(() => {
    if (!selectedDay || !selectedSet || processedQuestions.length === 0 || finished) return;

    saveProgress({
      selectedDay,
      selectedSet,
      processedQuestions,
      currentQuestion,
      correctCount,
      wrongCount,
    });
  }, [selectedDay, selectedSet, processedQuestions, currentQuestion, correctCount, wrongCount, finished]);

  // Load JSON and optionally restore saved progress
  useEffect(() => {
    if (!selectedDay || !selectedSet) return;

    fetch(`/${selectedDay}/set${selectedSet}.json`)
      .then(res => res.json())
      .then(json => {
        setData(json);

        // Check if we should restore saved progress for this exact day+set
        const saved = loadProgress();
        if (
          saved &&
          saved.selectedDay === selectedDay &&
          saved.selectedSet === selectedSet &&
          saved.processedQuestions?.length > 0
        ) {
          // Restore exactly where the user left off
          setProcessedQuestions(saved.processedQuestions);
          setCurrentQuestion(saved.correctCount + saved.wrongCount);
          setCorrectCount(saved.correctCount);
          setWrongCount(saved.wrongCount);
        } else {
          // Fresh start – randomise options
          const randomized = json.map(q => {
            const allOptions = shuffleArray([...q.options, q.answer]);
            return { ...q, displayOptions: allOptions };
          });
          setProcessedQuestions(randomized);
          setCurrentQuestion(0);
          setCorrectCount(0);
          setWrongCount(0);
        }
      })
      .catch(err => console.error("Failed to load quiz:", err));
  }, [selectedDay, selectedSet]);


  // ── Navigation helpers ──────────────────────────────────────────────────────
  const selectDay = (day) => {
    setSelectedDay(day);
    resetQuizState();
  };

  const selectSet = (setNumber) => {
    setSelectedSet(setNumber);
    resetQuizState();
  };

  const resetQuizState = () => {
    setData(null);
    setProcessedQuestions([]);
    setCurrentQuestion(0);
    setSelected(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
  };

  const backToSets = () => {
    setSelectedSet(null);
    setData(null);
    setProcessedQuestions([]);
    setFinished(false);
  };

  const backToDays = () => {
    setSelectedDay(null);
    setSelectedSet(null);
    setData(null);
    setProcessedQuestions([]);
    setFinished(false);
    setCompletedSets(loadCompleted());
  };

  // ── Resume from main menu ───────────────────────────────────────────────────
  const handleResume = () => {
    if (!resumeData) return;
    const { selectedDay: d, selectedSet: s, processedQuestions: pq,
            currentQuestion: cq, correctCount: cc, wrongCount: wc } = resumeData;

    setSelectedDay(d);
    setSelectedSet(s);
    setProcessedQuestions(pq);
    setCurrentQuestion(cc + wc);
    setCorrectCount(cc);
    setWrongCount(wc);
    setData(pq);
    setFinished(false);
    setSelected(null);
    setShowAnswer(false);

    setTimeout(() => {
      window.scrollTo({ top: 150, behavior: "instant" });
    }, 0);
  };

  // ── Answer handling ─────────────────────────────────────────────────────────
  const handleOptionClick = (index, optionText) => {
    if (showAnswer) return;
    const question = processedQuestions[currentQuestion];
    setSelected(index);
    setShowAnswer(true);
    if (optionText === question.answer) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setTimeout(() => {
      window.scrollTo({ top: 150, behavior: "instant" });
    }, 0);

    if (currentQuestion + 1 === processedQuestions.length) {
      const finalPct = Math.round((correctCount / processedQuestions.length) * 100);
      const key = `${selectedDay}-set${selectedSet}`;
      const updated = { ...loadCompleted(), [key]: `${finalPct}%` };
      saveCompleted(updated);
      setCompletedSets(updated);
      clearProgress();
      setResumeData(null);
      setFinished(true);
      return;
    }
    setCurrentQuestion(prev => prev + 1);
    setSelected(null);
    setShowAnswer(false);
  };

  // Helper: get completed score badge for a day+set combo
  const getSetScore = (dayKey, setNum) => completedSets[`${dayKey}-set${setNum}`] || null;
  const getDayBestScore = (dayKey) => {
    const scores = dayConfigs[dayKey].sets
      .map(s => completedSets[`${dayKey}-set${s}`])
      .filter(Boolean)
      .map(s => parseInt(s));
    if (!scores.length) return null;
    return Math.max(...scores);
  };

  // ── MENU SCREEN – SELECT DAY ────────────────────────────────────────────────
  if (!selectedDay) {
    return (
      <div className="quiz-container">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <div className="menu-card">
          <div className="menu-header">
            <div className="quiz-badge">QUIZ</div>
            <h1 className="menu-title">Choose Your Challenge</h1>
            <p className="menu-subtitle">Select a day to begin</p>
          </div>

          {/* Resume banner */}
          {resumeData && (
            <div className="resume-banner">
              <div className="resume-info">
                <span className="resume-icon">⏸</span>
                <div>
                  <p className="resume-label">You have an unfinished quiz</p>
                  <p className="resume-detail">
                    {dayConfigs[resumeData.selectedDay]?.title} · Set {resumeData.selectedSet} · Q{resumeData.correctCount + resumeData.wrongCount + 1}/{resumeData.processedQuestions?.length}
                  </p>
                </div>
              </div>
              <div className="resume-actions">
                <button className="resume-btn" onClick={handleResume}>Resume</button>
                <button className="resume-discard" onClick={() => { clearProgress(); setResumeData(null); }}>Discard</button>
              </div>
            </div>
          )}

          <div className="quiz-options">
            {Object.entries(dayConfigs).map(([dayKey, config], index) => {
              const setsCompleted = config.sets.filter(s => completedSets[`${dayKey}-set${s}`]).length;
              return (
                <button
                  key={dayKey}
                  className="quiz-select-btn"
                  onClick={() => selectDay(dayKey)}
                >
                  <div className="btn-content">
                    <span className="btn-number">{String(index + 1).padStart(2, '0')}</span>
                    <div className="btn-info">
                      <span className="btn-title">{config.title}</span>
                      <span className="btn-subtitle">{config.subtitle}</span>
                    </div>
                  </div>
                  <div className="btn-right">
                    {setsCompleted > 0 && (
                      <span className="day-progress-badge">
                        {setsCompleted}/{config.sets.length} sets
                      </span>
                    )}
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── SET SELECTION SCREEN ────────────────────────────────────────────────────
  if (selectedDay && !selectedSet) {
    const availableSets = dayConfigs[selectedDay]?.sets || [];
    const dayConfig = dayConfigs[selectedDay];

    return (
      <div className="quiz-container">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <div className="menu-card">
          <button className="back-link" onClick={backToDays}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Days
          </button>

          <div className="menu-header">
            <div className="quiz-badge">{dayConfig.title.toUpperCase()}</div>
            <h1 className="menu-title">Select a Set</h1>
            <p className="menu-subtitle">Choose which set to practice</p>
          </div>

          <div className="quiz-options">
            {availableSets.map((setNum) => {
              const score = getSetScore(selectedDay, setNum);
              const isResumable =
                resumeData &&
                resumeData.selectedDay === selectedDay &&
                resumeData.selectedSet === setNum;

              return (
                <button
                  key={setNum}
                  className={`quiz-select-btn ${score ? 'set-completed' : ''}`}
                  onClick={() => selectSet(setNum)}
                >
                  <div className="btn-content">
                    <span className="btn-number">{String(setNum).padStart(2, '0')}</span>
                    <div className="btn-info">
                      <span className="btn-title">Set {setNum}</span>
                      <span className="btn-subtitle">
                        {isResumable
                          ? `Resume · Q${resumeData.correctCount + resumeData.wrongCount + 1}/${resumeData.processedQuestions?.length}`
                          : score
                          ? 'Completed · Tap to retry'
                          : 'Practice Questions'}
                      </span>
                    </div>
                  </div>
                  <div className="btn-right">
                    {isResumable && !score && (
                      <span className="resume-pill">▶ Resume</span>
                    )}
                    {score && (
                      <span className={`score-badge ${parseInt(score) === 100 ? 'perfect' : parseInt(score) >= 70 ? 'good' : 'okay'}`}>
                        {score}
                      </span>
                    )}
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──────────────────────────────────────────────────────────
  if (!data || processedQuestions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p className="loading-text">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  const question = processedQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / processedQuestions.length) * 100;

  // ── RESULT SCREEN ───────────────────────────────────────────────────────────
  if (finished) {
    const percentage = Math.round((correctCount / processedQuestions.length) * 100);
    const isPerfect = percentage === 100;
    const isGood = percentage >= 70;

    return (
      <div className="quiz-container">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <div className="result-card">
          <div className={`result-icon ${isPerfect ? 'perfect' : isGood ? 'good' : 'okay'}`}>
            {isPerfect ? '🏆' : isGood ? '🎉' : '📚'}
          </div>

          <h2 className="result-title">
            {isPerfect ? 'Perfect Score!' : isGood ? 'Great Job!' : 'Keep Learning!'}
          </h2>

          <div className="score-circle">
            <svg className="score-ring" viewBox="0 0 120 120">
              <circle className="score-ring-bg" cx="60" cy="60" r="54" />
              <circle
                className="score-ring-fill"
                cx="60" cy="60" r="54"
                style={{
                  strokeDasharray: `${percentage * 3.39} 339`,
                  stroke: isPerfect ? '#10b981' : isGood ? '#3b82f6' : '#f59e0b'
                }}
              />
            </svg>
            <div className="score-percentage">{percentage}%</div>
          </div>

          <div className="result-stats">
            <div className="stat">
              <div className="stat-value correct">{correctCount}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value wrong">{wrongCount}</div>
              <div className="stat-label">Wrong</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value total">{processedQuestions.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>

          <div className="result-actions">
            <button className="back-btn secondary" onClick={backToSets}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Sets
            </button>
            <button className="back-btn" onClick={backToDays}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-header">
          <div className="quiz-nav-buttons">
            <button className="quiz-nav-btn" onClick={backToSets} title="Back to Sets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Sets</span>
            </button>
            <button className="quiz-nav-btn" onClick={backToDays} title="Back to Main Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Menu</span>
            </button>
          </div>

          <div className="quiz-context-label">
            <span>{dayConfigs[selectedDay]?.title}</span>
            <span className="quiz-context-divider">·</span>
            <span>Set {selectedSet}</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="question-meta">
            <span className="question-number">Question {currentQuestion + 1} of {processedQuestions.length}</span>
            <div className="score-tracker">
              <span className="score-item correct-score">{correctCount}</span>
              <span className="score-item wrong-score">{wrongCount}</span>
            </div>
          </div>
        </div>

        <h3 className="question-title">{question.question}</h3>

        <div className="options-grid">
          {question.displayOptions.map((option, index) => {
            let className = "option-card";
            const isCorrect = option === question.answer;
            const isSelected = index === selected;
            if (showAnswer) {
              if (isCorrect) className += " correct";
              else if (isSelected) className += " wrong";
            }
            return (
              <button
                key={index}
                className={className}
                onClick={() => handleOptionClick(index, option)}
                disabled={showAnswer}
              >
                <span className="option-text">{option}</span>
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="explanation-box">
            <div className="explanation-header"><span>Explanation</span></div>
            <p className="explanation-text">{question.explanation}</p>
            <button className="next-question-btn" onClick={nextQuestion}>
              {currentQuestion + 1 === processedQuestions.length ? 'Finish' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}