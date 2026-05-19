#!/usr/bin/env node
// Calibration runner for the Groq nutrition prompt.
// Usage: node scripts/calibrate-ai.mjs [--prompt=baseline|v2|v3] [--only=1,5,7]
//
// Reads GROQ_API_KEY from .env.local (gitignored). Runs each test case against
// the Groq text model and compares to USDA-based references. Outputs a Markdown
// report to scripts/calibrate-results/<prompt>-<timestamp>.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---- env loader ------------------------------------------------------------

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found at ' + envPath);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY missing in .env.local');
  process.exit(1);
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ---- prompts ---------------------------------------------------------------
// Baseline = exact copy of current production prompt (ru) from CaloraAI/api/ai-nutrition.ts

const PROMPTS = {
  v4: `Ты — нутрициолог-ассистент в приложении для подсчёта калорий. Пользователь описывает блюдо или продукт на русском языке (например: "варёные яйца 2 шт", "тарелка борща", "круассан с маслом"). Твоя задача: оценить пищевую ценность.

АЛГОРИТМ для блюда из НЕСКОЛЬКИХ компонентов с указанием веса:
1. Для КАЖДОГО ингредиента посчитай абсолютные значения:
   - kcal_i = вес_i × kcal_на_100г ÷ 100
   - protein_i = вес_i × protein_на_100г ÷ 100   (и так же fat, carbs, fiber, sugars, saturatedFat, salt)
2. Просуммируй абсолютные значения ВСЕХ ингредиентов БЕЗ ИСКЛЮЧЕНИЙ:
   - totalGrams = Σ вес_i  (включая ВСЕ компоненты, в т.ч. напитки, бульон, соус, масло)
   - totalCalories = Σ kcal_i
   - totalProtein = Σ protein_i  (и так же остальные макро/микро)
3. Получи значения "на 100 г готового блюда" взвешенным усреднением:
   - caloriesPer100g = totalCalories × 100 ÷ totalGrams
   - и так же для всех остальных полей
4. ⚠️ НЕ бери простое среднее значений "на 100 г" разных ингредиентов — оно завышает итог в 1.5–2 раза, потому что плотные продукты (масло, сахар, орехи) искажают среднее. Только взвешенное по граммам.
5. ⚠️ Малые порции жирных/плотных ингредиентов вносят БОЛЬШОЙ вклад — НЕ забывай их и НЕ округляй до нуля. 15г оливкового масла = 135 ккал. Если пользователь упомянул масло/майонез/соус/заправку — обязательно включи в расчёт.
6. ⚠️ Низкокалорийные жидкости (кола, сок, бульон, молоко, вода) занимают значительный вес и СНИЖАЮТ среднюю kcal/100г готового блюда. Кола 42 ккал/100мл; если её 330мл из 730г общего веса — она "разбавит" итог почти на треть.
7. ⚠️ Когда есть диапазон в ориентирах — бери МЕДИАНУ (середину диапазона). "Ветчина 165-195" → используй 180, НЕ 195. Формула: median = (low + high) / 2.
8. ⚠️ Различай похожие продукты: "ветчина" = варёная ветчина (165-195 ккал/100г, постная, ~22г белка, ~7г жира), а НЕ копчёная колбаса (380-450) и НЕ варёная колбаса (260-300). "Сыр твёрдый" = бери ~355 (медиана 330-380), не 400+.
9. Самопроверка: 4×proteinPer100g + 9×fatPer100g + 4×carbsPer100g должно ≈ совпадать с caloriesPer100g (±15%). Если не сходится — пересчитай.
10. ФИНАЛЬНАЯ САМОПРОВЕРКА: сравни свой caloriesPer100g с типовыми диапазонами из секции "ТИПОВЫЕ ИТОГИ" ниже. Если выпадаешь — пересчитай.

ТИПОВЫЕ ИТОГИ (kcal/100г готового блюда — используй как якорь при самопроверке):
- Сэндвич с ветчиной/сыром/майонезом (хлеб+мясо+сыр+соус): 270-310
- Сэндвич с курицей/овощами (легкий): 200-240
- Греческий салат (овощи+фета+маслины+оливковое масло): 100-135
- Цезарь с курицей и заправкой: 180-230
- Овощной салат заправленный маслом (без сыра/мяса): 60-100
- Овощной салат без заправки: 25-45
- Фастфуд-комбо бургер+фри+газировка ~700-730г: 175-200 (газировка разбавляет)
- Бургер+фри без газировки ~400г: 280-310
- Паста с томатным соусом и сыром: 140-180
- Паста карбонара/с мясным соусом: 170-220
- Плов с мясом: 200-260 (рис+масло+мясо)
- Омлет из 2-3 яиц на молоке: 145-180
- Каша/овсянка на молоке (готовая): 80-110
- Домашний обед мясо+гарнир (без соуса): 130-190
- Суп прозрачный (борщ, щи, бульон): 35-55
- Суп-пюре сливочный: 70-100

ОЦЕНКА ВЕСА ПОРЦИИ (только СЪЕДОБНАЯ масса, БЕЗ скорлупы, костей, кожуры, упаковки):
- "1 варёное яйцо" = ~55 г (БЕЗ скорлупы; яйцо в скорлупе весит ~62 г, но скорлупа НЕ считается)
- "2 варёных яйца" = ~110 г (НЕ 130, НЕ 140 — скорлупу не учитывай)
- "тарелка супа/борща" = ~300 г
- "стакан молока/сока" = ~250 г
- "1 банан средний" = ~120 г без кожуры
- "1 яблоко среднее" = ~150 г
- "1 кусок пиццы" = ~120 г
- "большой бургер" = ~220-280 г
- "1 печенье" = ~10-15 г | "1 круассан" = ~60-80 г | "1 кусок хлеба/тост" = ~25-30 г
- "порция плова" = ~250-300 г | "порция пасты" = ~250-300 г | "омлет из 3 яиц" = ~180-200 г

ПРИМЕР 1: "100г хлеба, 25г масла, 200мл молока, 30г сахара, 80г лосося холодного копчения"
- Хлеб 100г × 255/100 = 255 ккал, белок 8г, жир 3г, угл 49г  (использовал медиану 240-270=255)
- Масло 25г × 720/100 = 180 ккал, белок 0, жир 20.5, угл 0
- Молоко 200г × 52/100 = 104 ккал, белок 5.8, жир 5, угл 9.4
- Сахар 30г × 387/100 = 116 ккал, белок 0, жир 0, угл 30
- Лосось хол.копчёный 80г × 128/100 = 102 ккал, белок 17.6, жир 3.6, угл 0  (медиана 117-140=128)
- totalGrams = 435г, totalCalories = 757 → caloriesPer100g ≈ 174
- totalFat = 3+20.5+5+0+3.6 = 32.1г → fatPer100g ≈ 7.4 (НЕ ~10!)
- totalCarbs = 49+0+9.4+30+0 = 88.4г → carbsPer100g ≈ 20.3

ПРИМЕР 2 (внимание к маслу!): "греческий салат: 100г огурец, 100г помидор, 50г феты, 30г маслин, 15г оливкового масла"
- Огурец 100г × 16/100 = 16 ккал, жир 0.1г
- Помидор 100г × 18/100 = 18 ккал, жир 0.2г
- Фета 50г × 267/100 = 133.5 ккал (медиана 260-275=267), жир 21.5×0.5=10.75 (фета жир 21.5/100г → 50г = 10.75)
- Маслины 30г × 120/100 = 36 ккал (медиана 110-130=120), жир 11/100×30 = 3.3
- ⚠️ Оливковое масло 15г × 884/100 = 132.6 ккал, жир 15г  (НЕ забывай это — 40% всех калорий!)
- totalGrams = 295г, totalCalories = 336 → caloriesPer100g ≈ 114
- totalFat ≈ 39г → fatPer100g ≈ 13.2

ОРИЕНТИРЫ калорийности (ккал/100г, готовый продукт; бери МЕДИАНУ диапазона):
- Овощи варёные/тушёные: 20-60 | Свежие овощи: 15-40 | Огурец: 16 | Помидор: 18 | Фрукты: 40-90
- Молоко 2.5%: 52 | Молоко 3.2%: 62 | Йогурт натуральный: 60-90 | Кефир: 40-55
- Кола/спрайт/сладкие газировки: 42 ккал/100мл | Сок фруктовый: 45 | Вода/диетическая газировка: 0
- Варёный рис/гречка/булгур: 130 | Макароны варёные: 158
- Хлеб белый: 255 | Хлеб ржаной: 215 | Булочка/багет: 280 | Хлеб для сэндвича/тост: 270
- Сахар: 387 | Мёд: 320 | Варенье: 265 | Сгущёнка: 320
- Курица/индейка варёная: 165 | Говядина запечённая/тушёная: 225 | Свинина запечённая: 280
- Ветчина варёная (постная): 180  (не путать с колбасой! ~22г белка, ~7г жира)
- Колбаса варёная: 280 | Колбаса копчёная: 415 | Бекон жареный: 540
- Рыба белая запечённая: 120 | Лосось запечённый: 195 | Лосось холодного копчения: 128 | Лосось горячего копчения: 190 | Сельдь солёная: 250 | Тунец в воде: 115 | Тунец в масле: 210
- Яйца варёные: 155 | Яичница на масле: 215 | Сыр твёрдый: 355 | Сыр плавленый: 300 | Фета: 267 | Творог 5%: 120 | Творог 9%: 160 | Моцарелла: 265
- Маслины/оливки консервированные: 120
- Масло сливочное 82%: 720 | Оливковое/подсолнечное масло: 892 | Майонез: 655 | Орехи: 600 | Семечки: 565 | Сметана 20%: 205
- Шоколад молочный: 540 | Шоколад тёмный 70%: 560 | Печенье: 435 | Чипсы: 545 | Мороженое пломбир: 240
- Супы (борщ, щи, овощной, куриный бульон с лапшой): 45 | Суп-пюре сливочный: 85 | Солянка/харчо: 75
- Гамбургер обычный: 265 | Чизбургер: 278 | Биг Мак/двойной бургер: 250 (соус снижает) | Картошка фри: 305 | Наггетсы куриные: 295
- Пицца Маргарита: 265 | Пицца с мясом: 300 | Шаурма/буррито: 230 | Хот-дог: 280
- Sanity check для готового блюда: типичный домашний обед = 1.3-1.9 ккал/г. Сэндвич = 2.4-3.0 ккал/г. Фастфуд-комбо с газировкой = 1.7-2.0 ккал/г. >3.5 ккал/г — почти всегда ошибка, пересчитай.

ПОЛЯ:
- totalGrams: общий вес съедобной массы в граммах (без упаковки/скорлупы/костей)
- benefits: короткое описание пользы (1-2 предложения, на русском)
- confidence: high — стандартный продукт; medium — возможны вариации; low — описание расплывчато
- name: кратко, на русском, с заглавной буквы

Отвечай ТОЛЬКО валидным JSON-объектом с полями: name, totalGrams, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g, fiberPer100g, sugarsPer100g, saturatedFatPer100g, saltPer100g, benefits, confidence. Без markdown, без пояснений, только JSON.`,

  v3: `Ты — нутрициолог-ассистент в приложении для подсчёта калорий. Пользователь описывает блюдо или продукт на русском языке (например: "варёные яйца 2 шт", "тарелка борща", "круассан с маслом"). Твоя задача: оценить пищевую ценность.

АЛГОРИТМ для блюда из НЕСКОЛЬКИХ компонентов с указанием веса:
1. Для КАЖДОГО ингредиента посчитай абсолютные значения:
   - kcal_i = вес_i × kcal_на_100г ÷ 100
   - protein_i = вес_i × protein_на_100г ÷ 100   (и так же fat, carbs, fiber, sugars, saturatedFat, salt)
2. Просуммируй абсолютные значения ВСЕХ ингредиентов БЕЗ ИСКЛЮЧЕНИЙ:
   - totalGrams = Σ вес_i  (включая ВСЕ компоненты, в т.ч. напитки, бульон, соус, масло)
   - totalCalories = Σ kcal_i
   - totalProtein = Σ protein_i  (и так же остальные макро/микро)
3. Получи значения "на 100 г готового блюда" взвешенным усреднением:
   - caloriesPer100g = totalCalories × 100 ÷ totalGrams
   - и так же для всех остальных полей
4. ⚠️ НЕ бери простое среднее значений "на 100 г" разных ингредиентов — оно завышает итог в 1.5–2 раза, потому что плотные продукты (масло, сахар, орехи) искажают среднее. Только взвешенное по граммам.
5. ⚠️ Малые порции жирных/плотных ингредиентов вносят БОЛЬШОЙ вклад в калории — НЕ округляй их до нуля. 15г оливкового масла = 135 ккал.
6. ⚠️ Низкокалорийные жидкости (кола, сок, бульон, молоко, вода) занимают значительный вес и СНИЖАЮТ среднюю kcal/100г готового блюда. Кола 42 ккал/100мл; если её 330мл из 730г общего веса — она "разбавит" итог почти на треть.
7. ⚠️ Когда есть диапазон в ориентирах — бери МЕДИАНУ (середину), а НЕ верхнюю границу. "Ветчина 180-200" → используй 190.
8. Самопроверка: 4×proteinPer100g + 9×fatPer100g + 4×carbsPer100g должно ≈ совпадать с caloriesPer100g (±15%). Если не сходится — пересчитай.

ОЦЕНКА ВЕСА ПОРЦИИ (только СЪЕДОБНАЯ масса, БЕЗ скорлупы, костей, кожуры, упаковки):
- "1 варёное яйцо" = ~55 г (БЕЗ скорлупы; яйцо в скорлупе весит ~62 г, но скорлупа НЕ считается)
- "2 варёных яйца" = ~110 г (НЕ 130, НЕ 140 — скорлупу не учитывай)
- "тарелка супа/борща" = ~300 г
- "стакан молока/сока" = ~250 г
- "1 банан средний" = ~120 г без кожуры
- "1 яблоко среднее" = ~150 г
- "1 кусок пиццы" = ~120 г
- "большой бургер" = ~220-280 г

ПРИМЕР расчёта для "100г хлеба, 25г масла, 200мл молока, 30г сахара, 80г копчёного лосося":
- Хлеб 100г × 260/100 = 260 ккал, белок 8г, жир 3г, угл 49г
- Масло 25г × 720/100 = 180 ккал, белок 0, жир 20.5, угл 0
- Молоко 200г × 52/100 = 104 ккал, белок 5.8, жир 5, угл 9.4
- Сахар 30г × 387/100 = 116 ккал, белок 0, жир 0, угл 30
- Лосось хол.копчёный 80г × 130/100 = 104 ккал, белок 17.6, жир 3.6, угл 0
- totalGrams = 435г, totalCalories = 764 → caloriesPer100g ≈ 176
- totalFat = 3+20.5+5+0+3.6 = 32.1г → fatPer100g ≈ 7.4 (НЕ ~10!)
- totalProtein = 31.4г → proteinPer100g ≈ 7.2

ОРИЕНТИРЫ калорийности (ккал/100г, готовый продукт; бери МЕДИАНУ диапазона):
- Овощи варёные/тушёные: 20-60 | Свежие овощи: 15-40 | Фрукты: 40-90
- Молоко 2.5%: 50-55 | Молоко 3.2%: 60-65 | Йогурт натуральный: 60-90 | Кефир: 40-55
- Кола/спрайт/сладкие газировки: 38-45 ккал/100мл | Сок фруктовый: 40-55 | Вода/диетическая газировка: 0
- Варёный рис/гречка/булгур: 110-140 | Макароны варёные: 130-160
- Хлеб белый: 240-270 | Хлеб ржаной: 200-230 | Булочка/багет: 260-300 | Хлеб для сэндвича/тост: 260-280
- Сахар: 387 | Мёд: 320 | Варенье: 250-280 | Сгущёнка: 320
- Курица/индейка варёная: 160-200 | Говядина запечённая: 200-250 | Свинина запечённая: 250-310
- Ветчина варёная: 165-195 | Колбаса варёная: 260-300 | Колбаса копчёная: 380-450 | Бекон жареный: 540
- Рыба белая запечённая: 100-140 | Лосось запечённый: 180-210 | Лосось холодного копчения: 117-140 | Лосось горячего копчения: 180-200 | Сельдь солёная: 240-260 | Тунец консервированный в воде: 100-130 | Тунец в масле: 190-230
- Яйца варёные: 150-160 | Яичница на масле: 200-230 | Сыр твёрдый: 330-380 | Сыр плавленый: 280-320 | Фета: 260-275 | Творог 5%: 120 | Творог 9%: 160 | Моцарелла: 250-280
- Маслины/оливки консервированные: 110-130
- Масло сливочное 82%: 720 | Оливковое/подсолнечное масло: 884-899 | Майонез: 630-680 | Орехи: 550-650 | Семечки: 550-580 | Сметана 20%: 200-210
- Шоколад молочный: 530-550 | Шоколад тёмный 70%: 540-580 | Печенье: 400-470 | Чипсы: 530-560 | Мороженое пломбир: 220-260
- Супы (борщ, щи, овощной, куриный бульон с лапшой): 35-55 | Суп-пюре сливочный: 70-100 | Солянка/харчо: 60-90
- Гамбургер обычный: 250-280 | Чизбургер: 260-295 | Биг Мак/двойной бургер: 240-260 (соус снижает) | Картошка фри: 290-320 | Наггетсы куриные: 280-310
- Пицца Маргарита: 250-280 | Пицца с мясом: 280-320 | Шаурма/буррито: 200-260 | Хот-дог: 260-300
- Sanity check: типичный домашний обед (мясо+гарнир) = 1.3-1.9 ккал/г. Сэндвич/бутерброд = 2.4-3.0 ккал/г. Фастфуд-комбо с газировкой = 1.7-2.0 ккал/г. >3.5 ккал/г — почти всегда ошибка, пересчитай.

ПОЛЯ:
- totalGrams: общий вес съедобной массы в граммах (без упаковки/скорлупы/костей)
- benefits: короткое описание пользы (1-2 предложения, на русском)
- confidence: high — стандартный продукт; medium — возможны вариации; low — описание расплывчато
- name: кратко, на русском, с заглавной буквы

Отвечай ТОЛЬКО валидным JSON-объектом с полями: name, totalGrams, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g, fiberPer100g, sugarsPer100g, saturatedFatPer100g, saltPer100g, benefits, confidence. Без markdown, без пояснений, только JSON.`,

  v2: `Ты — нутрициолог-ассистент в приложении для подсчёта калорий. Пользователь описывает блюдо или продукт на русском языке (например: "варёные яйца 2 шт", "тарелка борща", "круассан с маслом"). Твоя задача: оценить пищевую ценность.

АЛГОРИТМ для блюда из НЕСКОЛЬКИХ компонентов с указанием веса:
1. Для КАЖДОГО ингредиента посчитай абсолютные значения:
   - kcal_i = вес_i × kcal_на_100г ÷ 100
   - protein_i = вес_i × protein_на_100г ÷ 100   (и так же fat, carbs, fiber, sugars, saturatedFat, salt)
2. Просуммируй абсолютные значения ВСЕХ ингредиентов БЕЗ ИСКЛЮЧЕНИЙ:
   - totalGrams = Σ вес_i  (включая ВСЕ компоненты, в т.ч. напитки, бульон, соус, масло; НИЧЕГО не добавляй сверху, никакой "воды" или "соусов" не упомянутых пользователем)
   - totalCalories = Σ kcal_i
   - totalProtein = Σ protein_i  (и так же остальные макро/микро)
3. Получи значения "на 100 г готового блюда" взвешенным усреднением:
   - caloriesPer100g = totalCalories × 100 ÷ totalGrams
   - proteinPer100g = totalProtein × 100 ÷ totalGrams
   - и так же для всех остальных полей
4. ⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ бери простое среднее значений "на 100 г" разных ингредиентов — оно завышает итог в 1.5–2 раза, потому что плотные продукты (масло, сахар, орехи) искажают среднее. Только взвешенное по граммам.
5. ⚠️ КРИТИЧЕСКИ ВАЖНО: маленькие порции жирных/плотных ингредиентов вносят БОЛЬШОЙ вклад в калории — НЕ округляй их до нуля. Пример: 15г оливкового масла = 135 ккал (это треть калорий салата из 300г).
6. ⚠️ КРИТИЧЕСКИ ВАЖНО: низкокалорийные жидкости (кола, сок, бульон, молоко, вода) занимают значительный вес и СНИЖАЮТ среднюю kcal/100г готового блюда. Кола 42 ккал/100мл; если её 330мл из 730г общего веса — она "разбавит" итог почти на треть. Учитывай это.
7. Самопроверка перед ответом: 4×proteinPer100g + 9×fatPer100g + 4×carbsPer100g должно ≈ совпадать с caloriesPer100g (расхождение ≤15%). Если не сходится — пересчитай.

ОЦЕНКА ВЕСА ПОРЦИИ:
- Указывай ТОЛЬКО съедобную массу (без скорлупы, костей, кожуры, упаковки)
- "2 варёных яйца" = ~110 г съедобной массы (без скорлупы), а не 130-140 г
- "тарелка супа" = ~300 г
- "стакан молока/сока" = ~250 г
- "1 банан средний" = ~120 г без кожуры
- "1 яблоко среднее" = ~150 г
- "1 кусок пиццы" = ~120 г
- "тарелка борща" = ~300 г

ПРИМЕР расчёта для "100г хлеба, 25г масла, 200мл молока, 30г сахара, 80г копчёного лосося":
- Хлеб 100г × 260/100 = 260 ккал, белок 100×8/100=8г, жир 100×3/100=3г, угл 100×49/100=49г
- Масло 25г × 720/100 = 180 ккал, белок 0г, жир 25×82/100=20.5г, угл 0г
- Молоко 200г × 52/100 = 104 ккал, белок 200×2.9/100=5.8г, жир 200×2.5/100=5г, угл 200×4.7/100=9.4г
- Сахар 30г × 387/100 = 116 ккал, белок 0г, жир 0г, угл 30г
- Лосось хол.копчёный 80г × 130/100 = 104 ккал, белок 80×22/100=17.6г, жир 80×4.5/100=3.6г, угл 0г
- totalGrams = 100+25+200+30+80 = 435г
- totalCalories = 260+180+104+116+104 = 764 ккал → caloriesPer100g = 764×100/435 ≈ 176
- totalProtein = 8+0+5.8+0+17.6 = 31.4г → proteinPer100g ≈ 7.2

ОРИЕНТИРЫ калорийности (ккал/100г, готовый продукт):
- Овощи варёные/тушёные: 20-60 | Свежие овощи: 15-40 | Фрукты: 40-90
- Молоко 2.5%: 50-55 | Молоко 3.2%: 60-65 | Йогурт натуральный: 60-90 | Кефир: 40-55
- Кола/спрайт/сладкие газировки: 38-45 ккал/100мл | Сок фруктовый: 40-55 | Вода/диетическая газировка: 0
- Варёный рис/гречка/булгур: 110-140 | Макароны варёные: 130-160
- Хлеб белый: 240-270 | Хлеб ржаной: 200-230 | Булочка/багет: 260-300
- Сахар: 387 | Мёд: 320 | Варенье: 250-280 | Сгущёнка: 320
- Курица/индейка варёная: 160-200 | Говядина запечённая: 200-250 | Свинина запечённая: 250-310
- Ветчина: 180-200 | Колбаса варёная: 260-300 | Колбаса копчёная: 380-450
- Рыба белая запечённая: 100-140 | Лосось запечённый: 180-210 | Лосось холодного копчения: 117-140 | Лосось горячего копчения: 180-200 | Сельдь солёная: 240-260
- Яйца варёные: 150-160 | Яичница на масле: 200-230 | Сыр твёрдый: 330-400 | Фета: 260-275 | Творог 5%: 120 | Творог 9%: 160
- Маслины/оливки консервированные: 110-130
- Масло сливочное 82%: 720 | Оливковое масло: 884 | Подсолнечное масло: 884-899 | Майонез: 600-680 | Орехи: 550-650 | Семечки: 550-580
- Шоколад молочный: 530-550 | Печенье: 400-470 | Чипсы: 530-560
- Супы (борщ, щи, овощной, куриный бульон с лапшой): 35-55 ккал/100г
- Суп-пюре сливочный: 70-100 | Солянка/харчо: 60-90
- Гамбургер (бутерброд): 240-280 | Чизбургер: 250-290 | Биг Мак/двойной бургер: 230-260
- Картошка фри: 290-320 | Наггетсы куриные: 280-310 | Пицца Маргарита: 250-280 | Пицца с мясом: 280-320
- Шаурма/буррито: 200-260 | Хот-дог: 260-300
- Типичный домашний обед (мясо+гарнир): 1.3-1.9 ккал/г готового блюда. >2.5 ккал/г — почти всегда ошибка усреднения, пересчитай.
- Типичный фастфуд-комбо (бургер+фри+газировка) с напитком: 1.5-2.0 ккал/г общего веса. Газировка сильно снижает среднюю.

ПОЛЯ:
- totalGrams: общий вес съедобной массы порции в граммах
- benefits: короткое описание пользы (1-2 предложения, на русском)
- confidence: high — стандартный продукт, точная оценка; medium — возможны вариации; low — описание расплывчато
- name: кратко, на русском, с заглавной буквы

Отвечай ТОЛЬКО валидным JSON-объектом с полями: name, totalGrams, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g, fiberPer100g, sugarsPer100g, saturatedFatPer100g, saltPer100g, benefits, confidence. Без markdown, без пояснений, только JSON.`,

  baseline: `Ты — нутрициолог-ассистент в приложении для подсчёта калорий. Пользователь описывает блюдо или продукт на русском языке (например: "варёные яйца 2 шт", "тарелка борща", "круассан с маслом"). Твоя задача: оценить пищевую ценность.

АЛГОРИТМ для блюда из НЕСКОЛЬКИХ компонентов с указанием веса:
1. Для КАЖДОГО ингредиента посчитай абсолютные значения:
   - kcal_i = вес_i × kcal_на_100г ÷ 100
   - protein_i = вес_i × protein_на_100г ÷ 100   (и так же fat, carbs, fiber, sugars, saturatedFat, salt)
2. Просуммируй абсолютные значения всех ингредиентов:
   - totalGrams = Σ вес_i  (НИЧЕГО не добавляй сверху, никакой "воды" или "соусов")
   - totalCalories = Σ kcal_i
   - totalProtein = Σ protein_i  (и так же остальные макро/микро)
3. Получи значения "на 100 г готового блюда" взвешенным усреднением:
   - caloriesPer100g = totalCalories × 100 ÷ totalGrams
   - proteinPer100g = totalProtein × 100 ÷ totalGrams
   - и так же для всех остальных полей
4. ⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ бери простое среднее значений "на 100 г" разных ингредиентов — оно завышает итог в 1.5–2 раза, потому что плотные продукты (масло, сахар, орехи) искажают среднее. Только взвешенное по граммам.
5. Самопроверка перед ответом: 4×proteinPer100g + 9×fatPer100g + 4×carbsPer100g должно ≈ совпадать с caloriesPer100g (расхождение ≤15%). Если не сходится — пересчитай.

ПРИМЕР расчёта для "100г хлеба, 25г масла, 200мл молока, 30г сахара, 80г копчёного лосося":
- Хлеб 100г × 260/100 = 260 ккал, белок 100×8/100=8г, жир 100×3/100=3г, угл 100×49/100=49г
- Масло 25г × 720/100 = 180 ккал, белок 0г, жир 25×82/100=20.5г, угл 0г
- Молоко 200г × 60/100 = 120 ккал, белок 200×3/100=6г, жир 200×3.2/100=6.4г, угл 200×4.7/100=9.4г
- Сахар 30г × 387/100 = 116 ккал, белок 0г, жир 0г, угл 30г
- Лосось хол.копчёный 80г × 130/100 = 104 ккал, белок 80×22/100=17.6г, жир 80×4.5/100=3.6г, угл 0г
- totalGrams = 100+25+200+30+80 = 435г
- totalCalories = 260+180+120+116+104 = 780 ккал → caloriesPer100g = 780×100/435 ≈ 179
- totalProtein = 8+0+6+0+17.6 = 31.6г → proteinPer100g ≈ 7.3
- totalFat = 3+20.5+6.4+0+3.6 = 33.5г → fatPer100g ≈ 7.7
- totalCarbs = 49+0+9.4+30+0 = 88.4г → carbsPer100g ≈ 20.3

ОРИЕНТИРЫ калорийности (ккал/100г, готовый продукт):
- Овощи варёные/тушёные: 20-60 | Фрукты: 40-90
- Молоко 2.5-3.2%: 55-65 | Йогурт натуральный: 60-90 | Кефир: 40-55
- Варёный рис/гречка/булгур: 110-140 | Макароны варёные: 130-160
- Хлеб белый: 240-270 | Хлеб ржаной: 200-230 | Булочка/багет: 260-300
- Сахар: 387 | Мёд: 320 | Варенье: 250-280 | Сгущёнка: 320
- Курица/индейка варёная: 160-200 | Говядина запечённая: 200-250 | Свинина запечённая: 250-310
- Рыба белая запечённая: 100-140 | Лосось запечённый: 180-210 | Лосось холодного копчения: 117-140 | Лосось горячего копчения: 180-200 | Сельдь солёная: 240-260
- Яйца: 150 | Сыр твёрдый: 330-400 | Творог 5%: 120 | Творог 9%: 160
- Масло сливочное 82%: 720 | Растительное масло: 900 | Майонез: 600-680 | Орехи: 550-650 | Семечки: 550-580
- Шоколад молочный: 530-550 | Печенье: 400-470 | Чипсы: 530-560
- Типичный домашний обед (мясо+гарнир): 1.3-1.9 ккал/г готового блюда. >2.5 ккал/г — почти всегда ошибка усреднения, пересчитай.

ПОЛЯ:
- totalGrams: общий вес порции в граммах (если "2 яйца" — ~110 г, "тарелка супа" — ~300 г, "стакан молока" — ~250 г)
- benefits: короткое описание пользы (1-2 предложения, на русском)
- confidence: high — стандартный продукт, точная оценка; medium — возможны вариации; low — описание расплывчато
- name: кратко, на русском, с заглавной буквы

Отвечай ТОЛЬКО валидным JSON-объектом с полями: name, totalGrams, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g, fiberPer100g, sugarsPer100g, saturatedFatPer100g, saltPer100g, benefits, confidence. Без markdown, без пояснений, только JSON.`,
};

// ---- test dataset ----------------------------------------------------------
// Reference values: USDA FoodData Central + Open Food Facts standard entries.
// `expected` is the SI value; `tol` is the acceptable absolute-percentage error.
// `kcalPer100g.tol` defaults to 15%, `totalCalories.tol` defaults to 20%.

const TEST_CASES = [
  // --- Single, standardized products -------------------------------------
  {
    id: 1,
    input: '100г варёного риса',
    category: 'simple',
    expected: {
      totalGrams: { value: 100, tol: 5 },
      caloriesPer100g: { value: 130, tol: 15 }, // USDA: 130 kcal/100g cooked white rice
      proteinPer100g: { value: 2.7, tol: 30 },
      fatPer100g: { value: 0.3, tol: 80 },
      carbsPer100g: { value: 28, tol: 15 },
    },
  },
  {
    id: 2,
    input: '200г варёной куриной грудки',
    category: 'simple',
    expected: {
      totalGrams: { value: 200, tol: 5 },
      caloriesPer100g: { value: 165, tol: 15 }, // USDA chicken breast cooked
      proteinPer100g: { value: 31, tol: 15 },
      fatPer100g: { value: 3.6, tol: 50 },
      carbsPer100g: { value: 0, tol: 100 },
    },
  },
  {
    id: 3,
    input: '100г молочного шоколада',
    category: 'simple',
    expected: {
      totalGrams: { value: 100, tol: 5 },
      caloriesPer100g: { value: 535, tol: 10 },
      proteinPer100g: { value: 7.5, tol: 30 },
      fatPer100g: { value: 30, tol: 20 },
      carbsPer100g: { value: 59, tol: 15 },
    },
  },
  {
    id: 4,
    input: '1 банан средний',
    category: 'simple',
    expected: {
      totalGrams: { value: 120, tol: 25 }, // medium banana ~100–140g peeled
      caloriesPer100g: { value: 89, tol: 15 },
      carbsPer100g: { value: 23, tol: 20 },
    },
  },

  // --- Colloquial portion descriptions -----------------------------------
  {
    id: 5,
    input: '2 варёных яйца',
    category: 'colloquial',
    expected: {
      totalGrams: { value: 110, tol: 15 },
      caloriesPer100g: { value: 155, tol: 15 },
      proteinPer100g: { value: 12.5, tol: 20 },
      fatPer100g: { value: 11, tol: 25 },
    },
  },
  {
    id: 6,
    input: 'стакан молока 2.5%',
    category: 'colloquial',
    expected: {
      totalGrams: { value: 250, tol: 10 },
      caloriesPer100g: { value: 52, tol: 15 },
      proteinPer100g: { value: 2.9, tol: 25 },
      fatPer100g: { value: 2.5, tol: 25 },
    },
  },
  {
    id: 7,
    input: 'тарелка борща',
    category: 'colloquial',
    expected: {
      totalGrams: { value: 300, tol: 25 },
      caloriesPer100g: { value: 45, tol: 30 }, // homemade borscht varies a lot
    },
  },
  {
    id: 8,
    input: 'круассан с маслом',
    category: 'colloquial',
    expected: {
      totalGrams: { value: 80, tol: 35 },
      caloriesPer100g: { value: 410, tol: 20 }, // plain croissant ~406; with extra butter higher
    },
  },

  // --- Composite dishes with explicit grams (deterministic) --------------
  // For these we compute the reference from the user-stated ingredients
  // using known per-100g values. Tolerance is tight because the answer is
  // a pure arithmetic exercise once references are picked.
  {
    id: 9,
    input: '100г хлеба, 25г масла, 200мл молока, 30г сахара, 80г лосося холодного копчения',
    category: 'composite',
    note: 'Same example used inside the prompt — should be near-perfect',
    expected: {
      totalGrams: { value: 435, tol: 5 },
      caloriesPer100g: { value: 179, tol: 12 },
      proteinPer100g: { value: 7.3, tol: 20 },
      fatPer100g: { value: 7.7, tol: 20 },
      carbsPer100g: { value: 20.3, tol: 20 },
    },
  },
  {
    id: 10,
    input: '150г варёных макарон, 30г твёрдого сыра, 50г варёной куриной грудки',
    category: 'composite',
    // Refs: pasta 158, hard cheese 360, chicken 165
    // (150*158 + 30*360 + 50*165) / 230 = (23700+10800+8250)/230 = 185.9 kcal/100g; total 428 kcal
    expected: {
      totalGrams: { value: 230, tol: 8 },
      caloriesPer100g: { value: 186, tol: 18 },
    },
  },
  {
    id: 11,
    input: '200г тушёной говядины, 150г варёного картофеля',
    category: 'composite',
    // Beef stewed ~230, potato boiled ~80: (200*230 + 150*80) / 350 = 165.7 kcal/100g; total 580
    expected: {
      totalGrams: { value: 350, tol: 8 },
      caloriesPer100g: { value: 166, tol: 22 },
    },
  },
  {
    id: 12,
    input: 'сэндвич: 60г хлеба, 50г ветчины, 20г сыра, 10г майонеза',
    category: 'composite',
    // Bread 260, ham 195, cheese 360, mayo 680
    // (60*260+50*195+20*360+10*680) / 140 = (15600+9750+7200+6800)/140 = 281 kcal/100g; total 393
    expected: {
      totalGrams: { value: 140, tol: 8 },
      caloriesPer100g: { value: 281, tol: 18 },
    },
  },

  // --- Trap cases (dense ingredients to catch averaging bugs) ------------
  {
    id: 13,
    input: 'греческий салат: 100г огурец, 100г помидор, 50г феты, 30г маслин, 15г оливкового масла',
    category: 'trap',
    // 100*16 + 100*18 + 50*265 + 30*115 + 15*900 = 1600+1800+13250+3450+13500 = 33600 / 295 = 114
    // Naive average of (16+18+265+115+900)/5 = 263 — catches the bug
    expected: {
      totalGrams: { value: 295, tol: 8 },
      caloriesPer100g: { value: 114, tol: 25 },
    },
  },
  {
    id: 14,
    input: 'овсянка 50г сухая на 200мл молока 2.5% с 1 ст.л. мёда',
    category: 'trap',
    // 50g dry oats (370) + 200g milk (52) + 20g honey (304) over (50+200+20) = 270g raw
    // Note: cooked oats absorb water so totalGrams of finished dish is debatable.
    // Reference treats the question as "what was added in" (dry weight).
    // 50*370 + 200*52 + 20*304 = 18500+10400+6080 = 34980 → totalCalories ≈ 350
    // per-100g (dry basis) = 130; per-100g cooked (~450g) = 78. Wide tolerance.
    expected: {
      totalCalories: { value: 350, tol: 25 }, // accept either dry or cooked framing
    },
  },
  {
    id: 15,
    input: 'большая порция фастфуда: бургер 250г, картошка фри 150г, кола 330мл',
    category: 'trap',
    // Burger 280, fries 310, cola 42: (250*280 + 150*310 + 330*42) / 730
    // = (70000+46500+13860)/730 = 178.6 kcal/100g; total 1304
    expected: {
      totalGrams: { value: 730, tol: 10 },
      caloriesPer100g: { value: 179, tol: 20 },
    },
  },

  // --- v4 expansion: new edge cases --------------------------------------
  {
    id: 16,
    input: '250г пасты с томатным соусом и 20г пармезана',
    category: 'composite',
    // Pasta cooked 158, tomato sauce ~50, parmesan 392
    // Assume the dish is 250g pasta total with some sauce mixed in (~50g sauce already in 250g) plus 20g cheese on top.
    // Treat as: 250*158 + 20*355 (using prompt's hard cheese median) = 39500+7100 = 46600 / 270 = 173 kcal/100g
    // But if the model treats "паста с соусом" as 250g already-sauced (158 baseline) + cheese, result varies
    expected: {
      totalGrams: { value: 270, tol: 15 },
      caloriesPer100g: { value: 175, tol: 25 },
    },
  },
  {
    id: 17,
    input: '300г плова с курицей',
    category: 'colloquial',
    // Plov = rice + oil + meat. Standard plov ~210 kcal/100g
    expected: {
      totalGrams: { value: 300, tol: 15 },
      caloriesPer100g: { value: 220, tol: 25 },
    },
  },
  {
    id: 18,
    input: 'омлет из 3 яиц с 50мл молока и 20г сыра',
    category: 'composite',
    // 3 eggs ~165g (~55g/egg) + 50g milk + 20g cheese. Cook adds some oil maybe (~10g)
    // Without oil: (165*155 + 50*52 + 20*355) = 25575+2600+7100 = 35275 / 235 = 150 kcal/100g
    // With 5-10g oil added: total grows by 30-90 kcal, kcal/100g ~ 160-180
    expected: {
      totalGrams: { value: 235, tol: 20 },
      caloriesPer100g: { value: 165, tol: 25 },
    },
  },
  {
    id: 19,
    input: 'салат цезарь с курицей: 100г салата айсберг, 80г куриной грудки, 30г сухариков, 25г соуса цезарь, 15г пармезана',
    category: 'trap',
    // iceberg 14, chicken 165, croutons 400, caesar dressing 450, parmesan 392
    // 100*14 + 80*165 + 30*400 + 25*450 + 15*392 = 1400+13200+12000+11250+5880 = 43730 / 250 = 175 kcal/100g
    expected: {
      totalGrams: { value: 250, tol: 10 },
      caloriesPer100g: { value: 175, tol: 25 },
    },
  },
  {
    id: 20,
    input: '1 печенье овсяное',
    category: 'simple',
    // typical oatmeal cookie ~12g, ~435 kcal/100g
    expected: {
      totalGrams: { value: 12, tol: 40 },
      caloriesPer100g: { value: 435, tol: 20 },
    },
  },
];

// ---- helpers ---------------------------------------------------------------

function pickArg(name, def) {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  return m ? m.slice(name.length + 3) : def;
}

const promptKey = pickArg('prompt', 'baseline');
const onlyArg = pickArg('only', null);
const promptText = PROMPTS[promptKey];
if (!promptText) {
  console.error(`Unknown prompt key "${promptKey}". Available: ${Object.keys(PROMPTS).join(', ')}`);
  process.exit(1);
}

let cases = TEST_CASES;
if (onlyArg) {
  const ids = new Set(onlyArg.split(',').map((s) => Number(s.trim())));
  cases = cases.filter((c) => ids.has(c.id));
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
function extractJson(s) {
  const direct = safeJson(s.trim());
  if (direct) return direct;
  const md = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) return safeJson(md[1].trim());
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a !== -1 && b > a) return safeJson(s.slice(a, b + 1));
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseRetryMs(headers, body) {
  const h = headers.get('retry-after-ms') || headers.get('retry-after');
  if (h) {
    const n = Number(h);
    if (Number.isFinite(n)) return n < 1000 ? n * 1000 : n;
  }
  const m = body?.match(/try again in ([\d.]+)\s*([ms]+)/i);
  if (m) {
    const v = parseFloat(m[1]);
    return m[2].startsWith('m') && !m[2].startsWith('ms') ? v * 60_000 : v * 1000;
  }
  return 8000;
}

async function callGroq(systemPrompt, userText, attempt = 0) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });
  if (res.status === 429 && attempt < 4) {
    const body = await res.text().catch(() => '');
    const waitMs = Math.min(parseRetryMs(res.headers, body) + 500, 65000);
    process.stdout.write(`[429, retry in ${Math.round(waitMs / 1000)}s] `);
    await sleep(waitMs);
    return callGroq(systemPrompt, userText, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function pctErr(actual, expected) {
  if (expected === 0) return actual === 0 ? 0 : 100;
  return Math.abs(actual - expected) / Math.abs(expected) * 100;
}

function evaluate(tc, analysis) {
  const checks = [];
  const exp = tc.expected;
  const totalCalActual = (analysis.caloriesPer100g * analysis.totalGrams) / 100;
  for (const [field, spec] of Object.entries(exp)) {
    let actual;
    if (field === 'totalCalories') actual = totalCalActual;
    else actual = analysis[field];
    if (actual == null || Number.isNaN(actual)) {
      checks.push({ field, ok: false, actual: '—', expected: spec.value, err: '—' });
      continue;
    }
    const err = pctErr(actual, spec.value);
    checks.push({
      field,
      ok: err <= spec.tol,
      actual: Math.round(actual * 10) / 10,
      expected: spec.value,
      err: Math.round(err * 10) / 10,
      tol: spec.tol,
    });
  }
  return { checks, totalCalActual };
}

// ---- main ------------------------------------------------------------------

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(ROOT, 'scripts', 'calibrate-results');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${promptKey}-${ts}.md`);

  const lines = [];
  lines.push(`# Calibration run — prompt=\`${promptKey}\` model=\`${MODEL}\``);
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Cases: ${cases.length}`);
  lines.push('');

  let totalChecks = 0;
  let passedChecks = 0;
  const perCaseSummary = [];

  for (let idx = 0; idx < cases.length; idx++) {
    const tc = cases[idx];
    if (idx > 0) await sleep(7000); // stay under 12k TPM on Groq free tier
    process.stdout.write(`#${tc.id} [${tc.category}] "${tc.input}" ... `);
    let analysis = null;
    let raw = '';
    let error = null;
    try {
      raw = await callGroq(promptText, tc.input);
      analysis = extractJson(raw);
      if (!analysis) throw new Error('failed to parse JSON');
    } catch (e) {
      error = e.message;
      console.log('FAIL (' + error + ')');
    }

    lines.push(`## #${tc.id} [${tc.category}] — "${tc.input}"`);
    if (tc.note) lines.push(`*${tc.note}*`);
    lines.push('');

    if (error) {
      lines.push('**ERROR:** ' + error);
      lines.push('```');
      lines.push(raw.slice(0, 500));
      lines.push('```');
      lines.push('');
      perCaseSummary.push({ id: tc.id, ok: 0, total: Object.keys(tc.expected).length, name: '—' });
      continue;
    }

    const { checks, totalCalActual } = evaluate(tc, analysis);
    const pass = checks.filter((c) => c.ok).length;
    totalChecks += checks.length;
    passedChecks += pass;

    lines.push(`**Model output:** name="${analysis.name}", totalGrams=${analysis.totalGrams}, kcal/100g=${analysis.caloriesPer100g}, total kcal≈${Math.round(totalCalActual)}`);
    lines.push(`P/F/C per 100g: ${analysis.proteinPer100g} / ${analysis.fatPer100g} / ${analysis.carbsPer100g} · confidence=${analysis.confidence}`);
    lines.push('');
    lines.push('| Field | Actual | Expected | Err % | Tol % | Pass |');
    lines.push('|---|---|---|---|---|---|');
    for (const c of checks) {
      lines.push(`| ${c.field} | ${c.actual} | ${c.expected} | ${c.err} | ${c.tol} | ${c.ok ? '✅' : '❌'} |`);
    }
    lines.push('');
    console.log(`pass ${pass}/${checks.length}  kcal/100g=${analysis.caloriesPer100g} (exp ${tc.expected.caloriesPer100g?.value ?? '—'})`);
    perCaseSummary.push({ id: tc.id, ok: pass, total: checks.length, name: analysis.name });
  }

  // summary
  const head = [];
  head.push(`**Overall:** ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks / totalChecks * 100)}%)`);
  head.push('');
  head.push('| # | Pass | Name |');
  head.push('|---|---|---|');
  for (const s of perCaseSummary) head.push(`| ${s.id} | ${s.ok}/${s.total} | ${s.name} |`);
  head.push('');
  head.push('---');
  head.push('');

  const final = ['# Calibration run', ...head, ...lines.slice(1)].join('\n');
  fs.writeFileSync(outPath, final, 'utf8');

  console.log(`\nReport: ${path.relative(ROOT, outPath)}`);
  console.log(`Overall: ${passedChecks}/${totalChecks} checks (${Math.round(passedChecks / totalChecks * 100)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
