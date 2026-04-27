# quizlab

## Требования

- Node.js
- [MariaDB](https://mariadb.org/download)

## 🚀 Быстрый старт

### Установка и настройка

1. Клонируйте репозиторий:
```bash
git clone -b draft https://github.com/popandr467/quizlab.git
cd quizlab
```

2. Установите зависимости: `npm install`

3. Создайте файл окружения:  
- Windows (cmd): `copy .env.example .env`  
- Linux/MacOS/PowerShell/Git Bash: `cp .env.example .env`  

4. Отредактируйте `.env` - добавьте свои значения:
- `DATABASE_URL` - url для подкоючения к БД
- `JWT_SECRET` - ключ для JWT (рекомендуется сгенерировать надёжный, например, при помоши команды: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `COOKIE_SECRET` - ключ для подписи cookies (можно мгенерировать так же, как и JWT_SECRET)
- `HASH_ROUNDS` - количество итераций хеширования (4-8 для отладки, 12 - для продакшена, больше 15 не рекомендуется)

5. Запустите проект: `npm start`

## Troubleshooting
### 🛠 Native Modules Setup
При ошибках компиляции (`node-gyp`, `bcrypt` и др.) установите системные зависимости для вашей ОС:

| ОС | Команда / Инструкция |
|---|---|
| **Windows** | Установите [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + **Python 3** (обязательно добавьте в `PATH`) |
| **Ubuntu/Debian** | `sudo apt update && sudo apt install -y build-essential python3` |
| **RHEL/Fedora** | `sudo dnf install -y gcc gcc-c++ make python3` |
| **Arch/Manjaro** | `sudo pacman -S base-devel python` |
| **macOS** | `xcode-select --install` |

> ⚡ После установки повторите `npm install`. Большинство модулей загружают готовые бинарники автоматически, компиляция требуется только при их отсутствии.

