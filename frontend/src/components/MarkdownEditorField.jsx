import { Controller } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import MarkdownText from "./MarkdownText";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

export default function MarkdownEditorField({
  control,
  name,
  rules,
  height = 180,
  placeholder = "Можно использовать Markdown",
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div data-color-mode="light">
          <MDEditor
            value={field.value ?? ""}
            onChange={(value) => field.onChange(value ?? "")}
            height={height}
            preview="edit"
            textareaProps={{ placeholder }}
          />

          <div className="border rounded p-2 mt-2 bg-light">
            <div className="text-muted small mb-1">Предпросмотр</div>
            <MarkdownText>{field.value}</MarkdownText>
          </div>
        </div>
      )}
    />
  );
}