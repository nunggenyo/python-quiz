import { useEffect, useState } from "react";
import "./quiz.css";

export default function Quiz() {
  const [data, setData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch("/quiz.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  const questions = data.topics.flatMap(topic => topic.questions);
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

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelected(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2>Quiz Finished 🎉</h2>
          <p>Total Questions: {questions.length}</p>
          <p>✅ Correct: {correctCount}</p>
          <p>❌ Wrong: {wrongCount}</p>

          <button className="next-btn" onClick={restartQuiz}>
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <h2 className="quiz-title">Quiz App</h2>

        <div className="question-count">
          Question {currentQuestion + 1} / {questions.length}
        </div>

        {/* LIVE SCORE DISPLAY */}
        <div style={{ marginBottom: "15px", fontSize: "14px" }}>
          ✅ {correctCount} | ❌ {wrongCount}
        </div>

        <h3 className="question-text">{question.question}</h3>

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
              Next Question →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
