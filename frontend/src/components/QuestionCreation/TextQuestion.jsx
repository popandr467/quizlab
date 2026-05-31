import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Form } from "react-bootstrap";
import MarkdownEditorField from "../MarkdownEditorField"

export default function TextQuestion({control, register, errors}){
  return (
    <Form.Group className="mb-3">
      <Form.Label>Правильный ответ</Form.Label>
      <Form.Control
        as="textarea"
        rows={4}
        placeholder="Введите правильный ответ"
        {...register("type_specific.text.correctAnswer", {
          required: "Введите правильный ответ",
        })}
      />
      <Form.Control.Feedback type="invalid">
        {errors.correctAnswer?.message}
      </Form.Control.Feedback>
    </Form.Group>
  )
}