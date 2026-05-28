import { use, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { ArrowRight, XCircle, SkipEndFill } from 'react-bootstrap-icons';
import { Row } from "react-bootstrap";

/**
 * Карточка для отображения вопроса
 * @param {Object} props
 * @param {number} props.index
 * @param {Object} props.question
 * @param {Boolean} props.last
 * @param {(index:Number,answer:Number|String)=>void} props.onNext
 * @param {(index:Number,answer:Number|String)=>void} props.onFinish
 */
export function Question({index, question, last, onNext, onFinish}){
  const [answer, setAnswer]=useState(()=>{
    switch (question.type){
      case 'text':return '';
      case 'choice':return 0;
    }
  });
  return (
    <div className="card mb-3" key={question.id}>
      <div className="card-body">
        <h2 className="h5">{index + 1}. {question.text}</h2>

        <div className="text-muted mb-2">Баллы: {question.points}</div>

        {question.type === "text" && (
          <Form.Control
            as="textarea" rows="3"
            value={answer ?? ""}
            onChange={e=>setAnswer(e.target.value)}
            placeholder="Введите ответ"
          />
        )}

        {question.type === "choice" && (
          <div>
            {question.options?.variants?.map((variant, variantIndex) => (
              <Form.Label className="mb-2" key={variantIndex}>
                <Form.Check
                  type="radio"
                  // name={`question-${question.id}`}
                  checked={Number(answer) === variantIndex}
                  onChange={() => setAnswer(variantIndex)}
                />
                {variant}
              </Form.Label>
            ))}
          </div>
        )}
        <Button variant="outline-success" onClick={()=>onNext(index, answer)}><ArrowRight/>{last?'Завершить':'Следующий вопрос'}</Button>
        {last&&<Button variant="outline-danger" onClick={()=>onFinish(index, answer)}><SkipEndFill/>Завершить досрочно</Button>}
      </div>
    </div>
  )
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
export function Answer({index, question, answer, givenAnswer}){
  return (
    <div className="card mb-3" key={question.id}>
      <Row className="card-body">
        <h2 className="h5">{index + 1}. {question.text}</h2>

        <div className="text-muted mb-2">Баллы: {question.points}</div>

        {question.type === "text" && (
          answer==givenAnswer?<Form.Control
            as="textarea" rows="3"
            className="border border-success"
            value={answer ?? ''}
            readOnly={true}
          />:<>
            <Form.Control
              as="textarea" rows="3"
              className="border border-danger"
              value={givenAnswer ?? <i>[Ответ не дан]</i>}
              readOnly={true}
            />
            <Form.Control
              as="textarea" rows="3"
              className="border border-success"
              value={answer ?? ""}
              readOnly={true}
            />
          </>
        )}

        {question.type === "choice" && (
            question.options?.variants?.map((variant, variantIndex) => (
                <Form.Check
                  readOnly={true}
                  type="radio"
                  // name={`question-${question.id}`}
                  checked={Number(givenAnswer) === variantIndex}
                  label={variant} key={variantIndex}
                style={answer==variantIndex?{color:'var(--bs-success)'}:
                    (givenAnswer==variantIndex?{color:'var(--bs-danger)'}:{})}
                  // style={answer==variantIndex?{backgroundColor:'var(--bs-success)',borderColor:'var(--bs-success)'}:
                  //   (givenAnswer==variantIndex?{backgroundColor:'var(--bs-danger)',borderColor:'var(--bs-danger)'}:{})}
                />
            ))
        )}
      </Row>
    </div>
  );
}