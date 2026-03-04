import { useEffect, useState } from "react";
import "./quiz.css";

const STORAGE_KEY = "quiz_progress";
const COMPLETED_KEY = "quiz_completed";

// ─── LocalStorage helpers (per-set map) ────────────────────────────────────
// Structure: { "day1-set2": { processedQuestions, correctCount, wrongCount } }
const loadAllProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSetProgress = (day, set, data) => {
  try {
    const all = loadAllProgress();
    all[`${day}-set${set}`] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { }
};

const clearSetProgress = (day, set) => {
  try {
    const all = loadAllProgress();
    delete all[`${day}-set${set}`];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { }
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
  } catch { }
};
// ─────────────────────────────────────────────────────────────────────────────

// Category → Day mapping
const categoryConfigs = {
  foundation: {
    label: "Foundation",
    emoji: "🧱",
    description: "Software Design, Python Basics & OOP",
    days: ["day1", "day2", "day3", "day4", "day5", "day6", "day7", "day8", "day9"],
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    glowColor: "rgba(99, 102, 241, 0.35)",
    comingSoon: false,
  },
  advanced: {
    label: "Advanced",
    emoji: "🚀",
    description: "Coming soon — stay tuned!",
    days: [],
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
    glowColor: "rgba(6, 182, 212, 0.35)",
    comingSoon: true,
  },
};

export default function Quiz() {
  const [selectedCategory, setSelectedCategory] = useState(null);
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
  const [savedProgress, setSavedProgress] = useState({});  // { "day1-set2": { processedQuestions, correctCount, wrongCount } }
  const [completedSets, setCompletedSets] = useState({});   // { "day1-set2": "95%" }
  const [confirmReset, setConfirmReset] = useState(false);

  const dayConfigs = {
    day1: { sets: [1, 2, 3, 4, 5], title: "Day 1", subtitle: "Software Design and Development" },
    day2: { sets: [1, 2, 3, 4, 5], title: "Day 2", subtitle: "Programming Basics - 1 (Python)" },
    day3: { sets: [1, 2, 3, 4, 5], title: "Day 3", subtitle: "Programming Basics - 2 (Python)" },
    day4: { sets: [1, 2, 3, 4, 5], title: "Day 4", subtitle: "Object Oriented Programming - 1 (Python)" },
    day5: { sets: [1, 2, 3, 4, 5], title: "Day 5", subtitle: "Object Oriented Programming - 1 (Python)" },
    day6: { sets: [1, 2, 3, 4, 5], title: "Day 6", subtitle: "Web Design & Development Fundamentals (Front-End) - 1" },
    day7: { sets: [1, 2, 3, 4, 5], title: "Day 7", subtitle: "Web Design & Development Fundamentals (Front-End) - 2" },
    day8: { sets: [1, 2, 3, 4, 5], title: "Day 8", subtitle: "Relational Database" },
    day9: { sets: [1, 2, 3, 4, 5], title: "Day 9", subtitle: "Web Application Development" }
  };

  // Sync savedProgress and completedSets from localStorage whenever the category screen is shown
  useEffect(() => {
    if (selectedCategory === null) {
      setCompletedSets(loadCompleted());
      setSavedProgress(loadAllProgress());
    }
  }, [selectedCategory]);

  // Shuffle utility
  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Persist progress per-set whenever quiz state changes (only while a quiz is active)
  useEffect(() => {
    if (!selectedDay || !selectedSet || processedQuestions.length === 0 || finished) return;

    saveSetProgress(selectedDay, selectedSet, {
      processedQuestions,
      currentQuestion,
      correctCount,
      wrongCount,
    });
  }, [selectedDay, selectedSet, processedQuestions, currentQuestion, correctCount, wrongCount, finished]);

  // Load JSON and optionally restore saved progress for this specific set
  useEffect(() => {
    if (!selectedDay || !selectedSet) return;

    fetch(`/${selectedDay}/set${selectedSet}.json`)
      .then(res => res.json())
      .then(json => {
        setData(json);

        // Check if this specific set has saved progress
        const saved = loadAllProgress()[`${selectedDay}-set${selectedSet}`];
        if (saved && saved.processedQuestions?.length > 0) {
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
  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedDay(null);
    resetQuizState();
  };

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
    setSavedProgress(loadAllProgress());
    setSelectedSet(null);
    setData(null);
    setProcessedQuestions([]);
    setFinished(false);
  };

  const backToDays = () => {
    setSavedProgress(loadAllProgress());
    setSelectedDay(null);
    setSelectedSet(null);
    setData(null);
    setProcessedQuestions([]);
    setFinished(false);
    setCompletedSets(loadCompleted());
  };

  const backToCategories = () => {
    setSavedProgress(loadAllProgress());
    setSelectedCategory(null);
    setSelectedDay(null);
    setSelectedSet(null);
    setData(null);
    setProcessedQuestions([]);
    setFinished(false);
    setCompletedSets(loadCompleted());
  };

  // (Resume is now automatic: clicking any set with saved progress restores it via the load useEffect)

  // ── Reset all progress ───────────────────────────────────────────────────
  const handleResetProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-cancel after 3 s if user does nothing
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    // Confirmed — wipe everything
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
    try { localStorage.removeItem(COMPLETED_KEY); } catch { }
    setSavedProgress({});
    setCompletedSets({});
    setConfirmReset(false);
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
      // Clear only this set's progress entry
      clearSetProgress(selectedDay, selectedSet);
      setSavedProgress(loadAllProgress());
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

  // ── CATEGORY SELECTION SCREEN ───────────────────────────────────────────────
  if (!selectedCategory) {
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
            <p className="menu-subtitle">Select a category to begin</p>
          </div>

          {/* Unfinished sets banner */}
          {Object.keys(savedProgress).length > 0 && (
            <div className="resume-banner">
              <div className="resume-info">
                <span className="resume-icon">⏸</span>
                <div>
                  <p className="resume-label">
                    {Object.keys(savedProgress).length} unfinished set{Object.keys(savedProgress).length > 1 ? 's' : ''}
                  </p>
                  <p className="resume-detail">Navigate to a day to continue where you left off</p>
                </div>
              </div>
            </div>
          )}

          <div className="category-grid">
            {Object.entries(categoryConfigs).map(([catKey, cat]) => {
              const totalSets = cat.days.reduce((acc, d) => acc + (dayConfigs[d]?.sets.length || 0), 0);
              const completedCount = cat.days.reduce((acc, d) => {
                return acc + (dayConfigs[d]?.sets.filter(s => completedSets[`${d}-set${s}`]).length || 0);
              }, 0);
              return (
                <button
                  key={catKey}
                  className={`category-card${cat.comingSoon ? ' category-coming-soon' : ''}`}
                  style={{ "--cat-gradient": cat.gradient, "--cat-glow": cat.glowColor }}
                  onClick={() => !cat.comingSoon && selectCategory(catKey)}
                  disabled={cat.comingSoon}
                >
                  <div className="category-emoji">{cat.emoji}</div>
                  <div className="category-info">
                    <span className="category-label">{cat.label}</span>
                    <span className="category-desc">{cat.description}</span>
                    {!cat.comingSoon && (
                      <span className="category-meta">
                        {cat.days.length} days · {totalSets} sets
                        {completedCount > 0 && ` · ${completedCount}/${totalSets} done`}
                      </span>
                    )}
                  </div>
                  {cat.comingSoon ? (
                    <span className="coming-soon-badge">Coming Soon</span>
                  ) : (
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reset progress */}
          <div className="reset-progress-area">
            <button
              className={`reset-progress-btn${confirmReset ? ' confirming' : ''}`}
              onClick={handleResetProgress}
            >
              {confirmReset ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Confirm? This clears all scores &amp; progress
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Reset All Progress
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MENU SCREEN – SELECT DAY ────────────────────────────────────────────────
  if (!selectedDay) {
    const catConfig = categoryConfigs[selectedCategory];
    const daysInCategory = catConfig.days;

    return (
      <div className="quiz-container">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <div className="menu-card">
          <button className="back-link" onClick={backToCategories}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Categories
          </button>

          <div className="menu-header">
            <div className="quiz-badge">{catConfig.emoji} {catConfig.label.toUpperCase()}</div>
            <h1 className="menu-title">Choose Your Day</h1>
            <p className="menu-subtitle">Select a day to begin</p>
          </div>

          <div className="quiz-options">
            {daysInCategory.map((dayKey, index) => {
              const config = dayConfigs[dayKey];
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
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              const setKey = `${selectedDay}-set${setNum}`;
              const savedForSet = savedProgress[setKey];
              // Resumable only if there is saved mid-progress AND it is not already completed
              const isResumable = !!savedForSet && !score;

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
                          ? `Resume · Q${savedForSet.correctCount + savedForSet.wrongCount + 1}/${savedForSet.processedQuestions?.length}`
                          : score
                            ? 'Completed · Tap to retry'
                            : 'Practice Questions'}
                      </span>
                    </div>
                  </div>
                  <div className="btn-right">
                    {isResumable && (
                      <span className="resume-pill">▶ Resume</span>
                    )}
                    {score && (
                      <span className={`score-badge ${parseInt(score) === 100 ? 'perfect' : parseInt(score) >= 70 ? 'good' : 'okay'}`}>
                        {score}
                      </span>
                    )}
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Sets
            </button>
            <button className="back-btn secondary" onClick={backToDays}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Days
            </button>
            <button className="back-btn" onClick={backToCategories}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sets</span>
            </button>
            <button className="quiz-nav-btn" onClick={backToCategories} title="Back to Main Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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