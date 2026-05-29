import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ending, shuffleArray } from "../utils";
import { Answer } from "../components/Question";
import { Alert, ProgressBar, Row } from "react-bootstrap";

export default function Report() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);
  useEffect(() => {
    api
      .getReport(id)
      .then((res) => setInfo(res))
      .catch((e) => setInfo({ error: e.message }));
  }, [id]);
  if (!info) return <Alert>Загрузка...</Alert>;
  if (info.error) return <Alert variant="danger">{info.danger}</Alert>;
  if (!info.user && !info.result && !info.answers)
    return <Alert variant="success">Тест пройден</Alert>;
  return (
    <Row className="g-2">
      {info.user && (
        <Alert variant="secondary">
          <Link to={`/profiles/${info.user.username}`}>{info.user.name}</Link>
        </Alert>
      )}
      {info.result && (
        <ProgressBar
          label={`${info.result.percentage}% (${info.result.score}/${info.result.max_score})`}
          now={info.result.percentage}
        />
      )}
      {info.answers &&
        info.answers.map((i, n) => (
          <Answer
            index={n}
            question={i}
            answer={i.correct_answer}
            givenAnswer={i.answer}
          />
        ))}
    </Row>
  );
}
