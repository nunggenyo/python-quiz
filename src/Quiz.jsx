import { useEffect, useState } from "react";
import "./quiz.css";

export default function Quiz() {
  const [quizFile, setQuizFile] = useState(null);
  const [data, setData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // Fetch selected quiz file
  useEffect(() => {
    if (!quizFile) return;

    fetch(`/${quizFile}`)
      .then(res => res.json())
      .then(json => setData(json));
  }, [quizFile]);

  const startQuiz = (file) => {
    setQuizFile(file);
    setData(null);
    setCurrentQuestion(0);
    setSelected(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
  };

  const restartToMenu = () => {
    setQuizFile(null);
    setData(null);
  };

  // ==========================
  // MENU SCREEN
  // ==========================
  if (!quizFile) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2>Select Quiz</h2>

          <button
            className="next-btn"
            onClick={() => startQuiz("day_1.json")}
          >
            Day 1
          </button>

          <button
            className="next-btn"
            onClick={() => startQuiz("day_2.json")}
            style={{ marginTop: "10px" }}
          >
            Day 2
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="loading">Loading...</div>;

  const questions = data.questions;
  const question = questions[currentQuestion];

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

  // ==========================
  // RESULT SCREEN
  // ==========================
  if (finished) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2>Quiz Finished 🎉</h2>
          <p>Total: {questions.length}</p>
          <p>✅ Correct: {correctCount}</p>
          <p>❌ Wrong: {wrongCount}</p>

          <button className="next-btn" onClick={restartToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // QUIZ SCREEN
  // ==========================
  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <h2>Question {currentQuestion + 1} / {questions.length}</h2>

        <p>{question.question}</p>

        <div className="options">
          {question.options.map((option, index) => {
            let className = "option-btn";

            if (showAnswer) {
              if (index === question.answer) className += " correct";
              else if (index === selected) className += " wrong";
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleOptionClick(index)}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <>
            <div className="explanation">
              <strong>Explanation:</strong> {question.explanation}
            </div>

            <button className="next-btn" onClick={nextQuestion}>
              Next →
            </button>
          </>
        )}

        <div style={{ marginBottom: "10px", marginTop: "15px", textAlign: "right", fontSize: "14px" }}>
          ✅ {correctCount} | ❌ {wrongCount}
        </div>

      </div>
    </div>
  );
}
