import { use, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { ArrowRight, XCircle, SkipEndFill } from "react-bootstrap-icons";
import { Row } from "react-bootstrap";
import MarkdownText from "./MarkdownText";

/**
 * Карточка для отображения вопроса
 * @param {Object} props
 * @param {number} props.index
 * @param {Object} props.question
 * @param {Boolean} props.last
 * @param {(index:Number,answer:Number|String)=>void} props.onNext
 * @param {(index:Number,answer:Number|String)=>void} props.onFinish
 */
export function Question({ index, question, last, onNext, onFinish }) {
  console.log(question);
  const [answer, setAnswer] = useState(() => {
    switch (question.type) {
      case "text":
        return "";
      case "choice":
        return 0;
      case 'multichoice':
        return 0;
    }
  });
  return (
    <div className="card mb-3" key={question.id}>
      <div className="card-body">
        <h2 className="h5">
          {index + 1}. <MarkdownText>{question.text}</MarkdownText>
        </h2>

        <div className="text-muted mb-2">Баллы: {question.points}</div>

        {question.type === "text" && (
          <Form.Control
            as="textarea"
            rows="3"
            value={answer ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введите ответ"
          />
        )}

        {question.type === "choice" &&
          question.options?.variants?.map((variant, variantIndex) => {
            const variantText =
              typeof variant === "string" ? variant : (variant?.text ?? "");

            return (
              <label className="d-block mb-2" key={variantIndex}>
                <input
                  className="form-check-input me-2"
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer === variantIndex}
                  onChange={() => setAnswer(variantIndex)}
                />
                <span className="d-inline-block align-top">
                  <MarkdownText>{variantText}</MarkdownText>
                </span>
              </label>
            );
          })
        }

        {question.type === "multichoice" &&
          question.options?.variants?.map((variant, variantIndex) => {
            const variantText =
              typeof variant === "string" ? variant : (variant?.text ?? "");

            return (
              <label className="d-block mb-2" key={variantIndex}>
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  name={`question-${question.id}`}
                  checked={Boolean((answer>>variantIndex)&1)}
                  onChange={() => setAnswer(prev=>prev^(1<<variantIndex))}
                />
                <span className="d-inline-block align-top">
                  <MarkdownText>{variantText}</MarkdownText>
                </span>
              </label>
            );
          })
        }
        
        <Button variant="outline-success" onClick={() => onNext(index, answer)}>
          <ArrowRight />
          {last ? "Завершить" : "Следующий вопрос"}
        </Button>
        {!last && (
          <Button
            variant="outline-danger"
            onClick={() => onFinish(index, answer)}
          >
            <SkipEndFill />
            Завершить досрочно
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Карточка для отображения ответа на вопрос
 * @param {Object} props
 * @param {number} props.index
 * @param {Object} props.question
 * @param {number|string} props.answer
 * @param {number|string} props.givenAnswer
 *
 */
export function Answer({ index, question, answer, givenAnswer }) {
  const isCorrect = answer == givenAnswer;

  return (
    <>
      <h2 className="d-flex gap-2 align-items-start">
        <span>{index + 1}.</span>
        <MarkdownText>{question.text}</MarkdownText>
      </h2>

      <p className="text-muted">Баллы: {question.points}</p>

      {question.type === "text" && (
        <Form.Control
          className={isCorrect ? "is-valid" : "is-invalid"}
          value={givenAnswer || "[Ответ не дан]"}
          readOnly
        />
      )}

      {question.type === "choice" && (
        <div>
          {question.options?.variants?.map((variant, variantIndex) => {
            const variantText =
              typeof variant === "string" ? variant : (variant?.text ?? "");

            const isUserAnswer = variantIndex == givenAnswer;
            const isRightAnswer = variantIndex == answer;

            let className = "answer-option";

            if (isRightAnswer) {
              className += " answer-option-correct";
            }

            if (isUserAnswer && !isRightAnswer) {
              className += " answer-option-wrong";
            }

            return (
              <div className={className} key={variantIndex}>
                <MarkdownText>{variantText}</MarkdownText>

                {isRightAnswer && (
                  <small className="text-success ms-2">правильный ответ</small>
                )}

                {isUserAnswer && !isRightAnswer && (
                  <small className="text-danger ms-2">ваш ответ</small>
                )}
              </div>
            );
          })}
        </div>
      )}

      {question.type === "multichoice" && (
        <div>
          {question.options?.variants?.map((variant, variantIndex) => {
            const variantText =
              typeof variant === "string" ? variant : (variant?.text ?? "");

            const isUserAnswer = Boolean((givenAnswer>>variantIndex)&1);
            const isRightAnswer = Boolean((answer>>variantIndex)&1);

            let className = "answer-option";

            if (isRightAnswer) {
              className += " answer-option-correct";
            }

            if (isUserAnswer && !isRightAnswer) {
              className += " answer-option-wrong";
            }

            return (
              <div className={className} key={variantIndex}>
                <MarkdownText>{variantText}</MarkdownText>

                {isRightAnswer && (
                  <small className="text-success ms-2">правильный ответ</small>
                )}

                {isUserAnswer && !isRightAnswer && (
                  <small className="text-danger ms-2">ваш ответ</small>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
