# USTA TOP — Instagram Landing

Cinematic Instagram-gateway для сервиса поиска мастеров **USTA TOP** (Ташкент).

## Стек

- React 19 + Vite 7
- Tailwind CSS 4
- Lucide React (иконки)
- Чистый CSS-анимации (GPU-friendly: transform / opacity / filter)

## Команды

```bash
npm install      # установка
npm run dev      # разработка
npm run build    # сборка в dist/
```

## Ссылки продукта

- Сайт: https://www.ustatop360.uz/
- Telegram-бот: https://t.me/UstTop_bot

## Деплой

Проект собирается в один файл (`vite-plugin-singlefile`) — деплоится на любой статический хостинг: Vercel, Netlify, GitHub Pages, Cloudflare Pages.

Для Vercel есть готовый `vercel.json` (автоопределение Vite + SPA fallback).
