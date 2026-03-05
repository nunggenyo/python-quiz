import { useEffect, useState } from "react";
import "./quiz.css";

export default function Quiz() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [data, setData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // Manual configuration of sets per day
  const dayConfigs = {
    day1: { sets: 3, title: "Day 1", subtitle: "Software Design and Development" },
    day2: { sets: 5, title: "Day 2", subtitle: "Programming Basics - 1 (Python)" },
    day3: { sets: 5, title: "Day 3", subtitle: "Programming Basics - 2 (Python)" }
  };

  // Fetch selected quiz file
  useEffect(() => {
    if (!selectedDay || !selectedSet) return;

    fetch(`/${selectedDay}/set${selectedSet}.json`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Failed to load quiz:", err));
  }, [selectedDay, selectedSet]);

  const selectDay = (day) => {
    setSelectedDay(day);
    setSelectedSet(null);
    setData(null);
    setCurrentQuestion(0);
    setSelected(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
  };

  const selectSet = (setNumber) => {
    setSelectedSet(setNumber);
    setData(null);
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
  };

  const backToDays = () => {
    setSelectedDay(null);
    setSelectedSet(null);
    setData(null);
  };

  // MENU SCREEN - SELECT DAY
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

          <div className="quiz-options">
            {Object.entries(dayConfigs).map(([dayKey, config], index) => (
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
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SET SELECTION SCREEN
  if (selectedDay && !selectedSet) {
    const availableSets = Array.from({ length: dayConfigs[selectedDay]?.sets || 0 }, (_, i) => i + 1);
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
            {availableSets.map((setNum) => (
              <button
                key={setNum}
                className="quiz-select-btn"
                onClick={() => selectSet(setNum)}
              >
                <div className="btn-content">
                  <span className="btn-number">{String(setNum).padStart(2, '0')}</span>
                  <div className="btn-info">
                    <span className="btn-title">Set {setNum}</span>
                    <span className="btn-subtitle">Practice Questions</span>
                  </div>
                </div>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="quiz-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p className="loading-text">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  const questions = data.questions;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleOptionClick = (index) => {
    if (showAnswer) return;

    setSelected(index);
    setShowAnswer(true);

    if (index === question.answer) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 === questions.length) {
      setFinished(true);
      return;
    }

    setCurrentQuestion(prev => prev + 1);
    setSelected(null);
    setShowAnswer(false);
  };

  // RESULT SCREEN
  if (finished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
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
                cx="60"
                cy="60"
                r="54"
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
              <div className="stat-value total">{questions.length}</div>
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
            <button className="back-btn" onClick={backToDays}>
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

  // QUIZ SCREEN
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
            <button className="quiz-nav-btn" onClick={backToDays} title="Back to Main Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Menu</span>
            </button>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="question-meta">
            <span className="question-number">Question {currentQuestion + 1} of {questions.length}</span>
            <div className="score-tracker">
              <span className="score-item correct-score">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                {correctCount}
              </span>
              <span className="score-item wrong-score">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                {wrongCount}
              </span>
            </div>
          </div>
        </div>

        <h3 className="question-title">{question.question}</h3>

        <div className="options-grid">
          {question.options.map((option, index) => {
            let className = "option-card";
            let icon = null;

            if (showAnswer) {
              if (index === question.answer) {
                className += " correct";
                icon = (
                  <svg className="option-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                );
              } else if (index === selected) {
                className += " wrong";
                icon = (
                  <svg className="option-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                );
              }
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleOptionClick(index)}
                disabled={showAnswer}
              >
                <span className="option-text">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="explanation-box">
            <div className="explanation-header">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>Explanation</span>
            </div>
            <p className="explanation-text">{question.explanation}</p>

            <button className="next-question-btn" onClick={nextQuestion}>
              {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}