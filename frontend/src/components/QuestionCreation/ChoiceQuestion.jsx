import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button, Form, InputGroup } from "react-bootstrap";
import MarkdownEditorField from "../MarkdownEditorField";

export default function ChoiceQuestion({control, setValue, watch}){
  const { fields, append, remove } = useFieldArray({
    control,
    name: "type_specific.choice.variants",
  });

  // Сброс формы при открытии (создание или редактирование)
  useEffect(() => {
    const missing = 2 - fields.length;
    for (let i = 0; i < missing; i++) {
      append({ text: "" });
    }
  }, [fields.length, append]);

  const addOption = () => {
    if (fields.length < 10) {
      append({ text: "" });
    }
  };

  // Удаление варианта (мин. 2)
  const removeOption = (index) => {
    if (fields.length > 2) {
      remove(index);
    }
  };
  return (
    <div>
      <Form.Label>Варианты ответов (от 2 до 10)</Form.Label>
      {fields.map((field, index) => (
        <InputGroup key={field.id} className="mb-2">
          <MarkdownEditorField
            control={control}
            name={`type_specific.choice.variants.${index}.text`}
            rules={{ required: "Введите вариант ответа" }}
            height={120}
            placeholder={`Вариант ${index + 1}. Можно использовать Markdown.`}
          />
          <InputGroup.Text>
            <Form.Check
              type="radio"
              name="correctOptionGroup"
              checked={index == watch("type_specific.choice.correct")}
              onChange={() =>
                setValue("type_specific.choice.correct", index)
              }
              aria-label="Правильный вариант"
            />
          </InputGroup.Text>
          <Button
            variant="outline-danger"
            onClick={() => removeOption(index)}
            disabled={fields.length <= 2}
          >
            Удалить
          </Button>
        </InputGroup>
      ))}
      <Button
        variant="secondary"
        onClick={addOption}
        disabled={fields.length >= 10}
        className="mt-2"
      >
        Добавить вариант
      </Button>
      {!(
        watch("type_specific.choice.correct") >= 0 &&
        watch("type_specific.choice.correct") <
          watch("type_specific.choice.variants")?.length
      ) &&
        watch("type_specific.choice.variants")?.length > 0 && (
          <div className="text-danger mt-2">
            Необходимо выбрать правильный вариант
          </div>
        )}
    </div>
  )
}