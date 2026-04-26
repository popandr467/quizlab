# quizlab

## 🚀 Быстрый старт

### Установка и настройка
1. Если у вас нет MariaDB, скачайте установщик по [ссылке](https://mariadb.org/download), установите, создайте пользователя и БД

2. Клонируйте репозиторий:
```bash
git clone -b draft https://github.com/popandr467/quizlab.git
cd quizlab
```

3. Установите зависимости: `npm install`

4. Создайте файл окружения:  
Windows (cmd): `copy .env.example .env`  
Linux/MacOS/PowerShell/Git Bash: `copy .env.example .env`  

5. Отредактируйте `.env` - добавьте свои значения (БД, ключ JWT)

6. Запустите проект: `npm start`

