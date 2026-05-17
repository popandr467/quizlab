import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <h1 className="h3">Страница не найдена</h1>
      <p className="text-muted">Такой страницы в QuizLab пока нет.</p>
      <Link className="btn btn-primary" to="/">
        На главную
      </Link>
    </div>
  );
}
