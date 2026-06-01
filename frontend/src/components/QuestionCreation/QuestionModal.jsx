// QuestionModal.jsx
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import MarkdownEditorField from "../MarkdownEditorField";
import TextQuestion from "./TextQuestion";
import ChoiceQuestion from "./ChoiceQuestion";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import { api } from "../../api";

const TYPE_SPECIFIC_DEFAULTS = Object.freeze({
  text: { correctAnswer: "" },
  choice: {
    variants: [{ text: "" }, { text: "" }],
    correct: -1,
  },
  multichoice: {
    variants: [{ text: "" }, { text: "" }],
    correct: 0,
  }
});

const DEFAULTS = Object.freeze({
  title: "",
  points: 0,
  type: "text",
  images: [],
  type_specific: TYPE_SPECIFIC_DEFAULTS,
});



function fill_defaults(data) {
  const res = {
    ...DEFAULTS,
    ...data,
    type_specific: {
      ...TYPE_SPECIFIC_DEFAULTS,
      ...((data.type ?? data.type_specific)
        ? { [data.type]: data.type_specific[data.type] }
        : {}),
      // ...(data.type_specific?.choice?.variants?
      //   {choice: Object.assign(
      //     data.type_specific.choice.variants,
      //     {0:{ text: "" }, 1:{ text: "" }}
      //   )}:
      //   {}
      // ),
    },
  };
  return res;
}

function type_specific_checks(data) {
  if (data.type === "choice") {
    const hasCorrect =
      data.type_specific.choice.correct >= 0 &&
      data.type_specific.choice.correct <
        data.type_specific.choice.variants.length;
    if (!hasCorrect) {
      alert("Пожалуйста, выберите правильный вариант ответа");
      return false;
    }
  }
  if(data.type === 'multichoice' && data.type_specific.multichoice.correct===0) alert('Выберите хотя бы один вариант')
  return true;
}

/**
 * Модальное окно для создания/редактирования вопроса
 * @param {boolean} show - видимость модального окна
 * @param {function} onHide - колбэк закрытия
 * @param {function} onSubmit - колбэк сохранения (получает данные вопроса)
 * @param {object} initialData - данные редактируемого вопроса (если есть)
 */
const QuestionModal = ({ show, onHide, onSubmit, initialData }) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULTS,
  });
  const questionType = watch("type");

  // При переключении на тип "выбор" добавляем недостающие варианты до минимума
  useEffect(() => {
    if (!show) return;
    if (initialData) reset(fill_defaults(initialData));
    else reset(DEFAULTS);
  }, [initialData, reset, show]);

  // Обработка отправки формы
  const onFormSubmit = (data) => {
    if (!type_specific_checks(data)) return;
    onSubmit({
      ...data,
      type_specific: { [data.type]: data.type_specific[data.type] },
    });
    onHide(); // Закрываем окно после сохранения (родитель может переопределить)
  };

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setUploadingImage(true);

      const result = await api.uploadImage(file);

      appendImage({
        url: result.url,
        altText: "",
        sortOrder: imageFields.length,
      });
    } catch (error) {
      alert(error.message || "Не удалось загрузить картинку");
    } finally {
      setUploadingImage(false);
    }
  };

  const copyImageUrl = async (url) => {
  try {
    const absoluteUrl = new URL(url, window.location.origin).toString();

    await navigator.clipboard.writeText(absoluteUrl);

    alert("Ссылка на картинку скопирована");
  } catch (error) {
    console.error(error);
    alert("Не удалось скопировать ссылку");
  }
};

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? "Редактировать вопрос" : "Создать вопрос"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onFormSubmit)}>
        <Modal.Body>
          {/* Заголовок вопроса */}
          <Form.Group className="mb-3">
            <Form.Label>Заголовок вопроса</Form.Label>

            <MarkdownEditorField
              control={control}
              name="title"
              rules={{ required: "Введите текст вопроса" }}
              height={220}
              placeholder="Введите текст вопроса. Можно использовать Markdown."
            />

            {errors.title && (
              <div className="text-danger small mt-1">{errors.title.message}</div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Баллы</Form.Label>
            <Form.Control
              type="text"
              {...register("points", {
                required: "Заголовок обязателен",
                min: { value: 0, message: "Введите положительное число" },
              })}
              isInvalid={!!errors.points}
            />
            <Form.Control.Feedback type="invalid">
              {errors.points?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Картинки к вопросу</Form.Label>

            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              disabled={uploadingImage || imageFields.length >= 10}
            />

            <Form.Text className="text-muted">
              Можно добавить до 10 картинок. Текст вопроса и варианты ответов по-прежнему могут содержать Markdown.
            </Form.Text>

            {imageFields.length > 0 && (
              <div className="mt-3 d-flex flex-column gap-2">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="border rounded p-2">
                    <input type="hidden" {...register(`images.${index}.url`)} />
                    <input
                      type="hidden"
                      {...register(`images.${index}.sortOrder`, {
                        valueAsNumber: true,
                      })}
                    />

                    <div className="d-flex gap-3 align-items-start">
                      <img
                        src={field.url}
                        alt=""
                        className="img-fluid rounded border"
                        style={{ maxWidth: 180, maxHeight: 120, objectFit: "contain" }}
                      />

                      <div className="flex-grow-1">
                        <Form.Control
                          placeholder="Описание картинки, необязательно"
                          {...register(`images.${index}.altText`)}
                        />

                        <div className="d-flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => copyImageUrl(field.url)}
                          >
                            Скопировать ссылку
                          </Button>

                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            Удалить картинку
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.Group>

          {/* Тип вопроса */}
          <Form.Group className="mb-3">
            <Form.Label>Тип вопроса</Form.Label>
            <div>
              <Form.Check
                inline
                label="Текст (ввод ответа)"
                type="radio"
                value="text"
                {...register("type")}
                id="type-text"
              />
              <Form.Check
                inline
                label="Выбор варианта"
                type="radio"
                value="choice"
                {...register("type")}
                id="type-choice"
              />
              <Form.Check
                inline
                label="Мультивыбор"
                type="radio"
                value="multichoice"
                {...register("type")}
                id="type-multichoice"
              />
            </div>
          </Form.Group>

          {/* Поля для типа "текст" */}
          {questionType === "text" && (
            <TextQuestion
              control={control}
              register={register}
              errors={errors}
            />
          )}

          {/* Поля для типа "выбор" */}
          {questionType === "choice" && (
            <ChoiceQuestion
              control={control}
              setValue={setValue}
              watch={watch}
            />
          )}

          {/* Поля для типа "мультивыбор" */}
          {questionType === "multichoice" && (
            <MultiChoiceQuestion
              control={control}
              setValue={setValue}
              watch={watch}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Отмена
          </Button>
          <Button variant="primary" type="submit">
            Сохранить
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default QuestionModal;
