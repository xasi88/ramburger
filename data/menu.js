// Всё содержимое меню: кафе, разделы и блюда.
// Внутри window.MENU_DATA = { ... } строгий JSON: двойные кавычки, без комментариев и запятых в конце.
// Блюда, цены и состав только с картинок меню кафе (исходники/меню, 2026-10-27). Чего нет на картинке, того нет и здесь.
// Фото: img/food, вырезаны из тех же картинок (исходники/вырезать-фото.py).
// options: варианты блюда со своей ценой. off: нет в наличии. icon: рисунок из js/icons.js, если нет фото.
window.MENU_DATA = {
  "cafe": {
    "name": "Рамбургер",
    "latin": "Ramburger",
    "tagline": "Суши и фастфуд",
    "place": "Валерик",
    "hours": "Каждый день 11:00 - 23:00",
    "open": 11,
    "close": 23,
    "phone": "79280026880",
    "phoneText": "+7 928 002-68-80",
    "instagram": "_ramburger_",
    "delivery": 150,
    "demo": true
  },
  "menu": [
    {
      "id": "combo",
      "title": "Комбо",
      "note": "Обед в одной коробке. Два соуса в каждом комбо.",
      "items": [
        { "id": "combo1", "name": "Комбо 1", "desc": "Тортилья сырная, куриный поп-корн, картошка по-деревенски, два соуса.", "price": 430, "icon": "combo", "photo": "img/food/combo1.webp" },
        { "id": "combo2", "name": "Комбо 2", "desc": "Хот-дог, стрипсы, картошка фри, два соуса.", "price": 430, "icon": "combo", "photo": "img/food/combo2.webp" },
        { "id": "combo3", "name": "Комбо 3", "desc": "Чизбургер, наггетсы, картошка по-деревенски, два соуса.", "price": 430, "icon": "combo", "photo": "img/food/combo3.webp" },
        { "id": "combo4", "name": "Комбо 4", "desc": "Шаурма, картошка фри, куриные крылышки, два соуса.", "price": 430, "icon": "combo", "photo": "img/food/combo4.webp" }
      ]
    },
    {
      "id": "burgers",
      "title": "Бургеры и хот-доги",
      "note": "",
      "items": [
        { "id": "hamburger", "name": "Гамбургер", "desc": "", "price": 140, "icon": "burger", "photo": "img/food/hamburger.webp" },
        { "id": "cheeseburger", "name": "Чизбургер", "desc": "", "price": 140, "icon": "burger", "photo": "img/food/cheeseburger.webp" },
        { "id": "burger-batter", "name": "Бургер в кляре", "desc": "", "price": 220, "icon": "burger", "photo": "img/food/burger-batter.webp" },
        { "id": "hotdog", "name": "Хот-дог", "desc": "", "price": 140, "icon": "hotdog", "photo": "img/food/hotdog.webp" },
        { "id": "ram-longer", "name": "Рам-лонгер", "desc": "", "price": 200, "icon": "hotdog", "photo": "img/food/ram-longer.webp" },
        { "id": "ciabatta", "name": "Чиабатта", "desc": "", "price": 250, "icon": "hotdog", "photo": "img/food/ciabatta.webp" }
      ]
    },
    {
      "id": "shawarma",
      "title": "Шаурма и лаваш",
      "note": "",
      "items": [
        { "id": "shawarma", "name": "Шаурма", "desc": "", "price": 150, "options": [{ "name": "Маленькая", "price": 150 }, { "name": "Средняя", "price": 200 }, { "name": "Большая", "price": 220 }], "icon": "wrap", "photo": "img/food/shawarma.webp" },
        { "id": "shawarma-batter", "name": "Шаурма в кляре", "desc": "", "price": 250, "icon": "wrap", "photo": "img/food/shawarma-batter.webp" },
        { "id": "donar", "name": "Донар", "desc": "", "price": 200, "icon": "wrap", "photo": "img/food/donar.webp" },
        { "id": "burrito", "name": "Бурито", "desc": "", "price": 200, "icon": "wrap", "photo": "img/food/burrito.webp" },
        { "id": "kinker", "name": "Кинкер", "desc": "", "price": 200, "icon": "wrap", "photo": "img/food/kinker.webp" }
      ]
    },
    {
      "id": "pizza",
      "title": "Пицца",
      "note": "Два размера: маленькая и большая.",
      "items": [
        { "id": "pz-bianca", "name": "Пицца-бьянка по-деревенски", "desc": "Курица, грибы, сыр, помидор, картошка по-деревенски.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-bianca.webp" },
        { "id": "pz-4seasons", "name": "Пицца 4 сезона", "desc": "Курица, грибы, колбаса, помидор, пекинка, сыр, майонез.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-4seasons.webp" },
        { "id": "pz-fries", "name": "Пицца фри", "desc": "Курица, сыр, фри, соус гиро.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-fries.webp" },
        { "id": "pz-assorti", "name": "Пицца Ассорти", "desc": "Курица, фарш мясной, грибы, помидор, сыр.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-assorti.webp" },
        { "id": "pz-chicken", "name": "Пицца куриная", "desc": "Курица, сыр, помидор.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-chicken.webp" },
        { "id": "pz-meat", "name": "Пицца мясная", "desc": "Фарш, помидор, сыр.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-meat.webp" },
        { "id": "pz-pepperoni", "name": "Пицца Пепперони", "desc": "Колбаса, сыр, соус пиццы.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-pepperoni.webp" },
        { "id": "pz-nutella", "name": "Пицца Нутелла", "desc": "Крем нутелла, киви, банан.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-nutella.webp" },
        { "id": "pz-classic", "name": "Пицца классик", "desc": "Два вида болгарского перца, сыр, курица.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-classic.webp" },
        { "id": "pz-mushroom", "name": "Пицца грибная", "desc": "Грибы, сыр, соус пиццы.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-mushroom.webp" },
        { "id": "pz-margarita", "name": "Пицца Маргарита", "desc": "Сыр, помидор, соус.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-margarita.webp" },
        { "id": "pz-mexican", "name": "Пицца Мексиканец", "desc": "Колбаса, сыр, острый перец халапеньо.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-mexican.webp" },
        { "id": "pz-cheese", "name": "Пицца сырная", "desc": "Сыр, сырный соус.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-cheese.webp" },
        { "id": "pz-fresh", "name": "Пицца Фреш", "desc": "Кукуруза, сыр, сосиски, соус.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-fresh.webp" },
        { "id": "pz-italian", "name": "Пицца Итальянская", "desc": "Помидор, красный лук, курица, сыр.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-italian.webp" },
        { "id": "pz-caesar", "name": "Пицца Цезарь", "desc": "Сыр, цезарь соус, пекинка, помидор, сухари, курица.", "price": 400, "options": [{ "name": "Маленькая", "price": 400 }, { "name": "Большая", "price": 450 }], "icon": "pizza", "photo": "img/food/pz-caesar.webp" }
      ]
    },
    {
      "id": "sushi",
      "title": "Суши",
      "note": "",
      "items": [
        { "id": "su-red-dragon", "name": "Красный дракон", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-red-dragon.webp" },
        { "id": "su-canada-roll", "name": "Ролл Канада", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-canada-roll.webp" },
        { "id": "su-sandwich", "name": "Сэндвич ролл", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-sandwich.webp" },
        { "id": "su-hot-chic", "name": "Горячий шик", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-hot-chic.webp" },
        { "id": "su-crazy-salmon", "name": "Бешеный лосось", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-crazy-salmon.webp" },
        { "id": "su-cheese", "name": "Сырный ролл", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-cheese.webp" },
        { "id": "su-fuji", "name": "Гора Фудзи", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-fuji.webp" },
        { "id": "su-typhoon", "name": "Ролл-Тайфун", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-typhoon.webp" },
        { "id": "su-philadelphia", "name": "Филадельфия", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-philadelphia.webp" },
        { "id": "su-california-salmon", "name": "Калифорния с лососем", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-california-salmon.webp" },
        { "id": "su-california-crab", "name": "Калифорния с крабом", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-california-crab.webp" },
        { "id": "su-canada", "name": "Канада", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-canada.webp" },
        { "id": "su-shrimp", "name": "Ролл с креветкой", "desc": "", "price": 240, "icon": "roll", "photo": "img/food/su-shrimp.webp" },
        { "id": "su-salmon", "name": "Ролл с лососем", "desc": "", "price": 240, "icon": "roll", "photo": "img/food/su-salmon.webp" },
        { "id": "su-fuji-yama", "name": "Гора Фудзияма", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-fuji-yami.webp" },
        { "id": "su-nagasaki", "name": "Нагасаки", "desc": "", "price": 300, "icon": "roll", "photo": "img/food/su-nagasaki.webp" },
        { "id": "su-mexican-tempura", "name": "Мексиканец темпура", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-mexican-tempura.webp" },
        { "id": "su-oasis", "name": "Оазис", "desc": "", "price": 330, "icon": "roll", "photo": "img/food/su-oasis.webp" }
      ]
    },
    {
      "id": "snacks",
      "title": "Закуски",
      "note": "",
      "items": [
        { "id": "fries", "name": "Картошка фри", "desc": "", "price": 140, "icon": "snack", "photo": "img/food/fries.webp" },
        { "id": "wedges", "name": "Картошка по-деревенски", "desc": "", "price": 140, "icon": "snack", "photo": "img/food/wedges.webp" },
        { "id": "wings", "name": "Крылышки", "desc": "", "price": 190, "options": [{ "name": "3 шт", "price": 190 }, { "name": "6 шт", "price": 370 }, { "name": "9 шт", "price": 530 }], "icon": "snack", "photo": "img/food/wings.webp" },
        { "id": "strips", "name": "Стрипсы", "desc": "", "price": 190, "options": [{ "name": "3 шт", "price": 190 }, { "name": "6 шт", "price": 360 }, { "name": "9 шт", "price": 500 }], "icon": "snack", "photo": "img/food/strips.webp" },
        { "id": "nuggets", "name": "Наггетсы", "desc": "", "price": 70, "options": [{ "name": "3 шт", "price": 70 }, { "name": "6 шт", "price": 140 }, { "name": "9 шт", "price": 220 }], "icon": "snack", "photo": "img/food/nuggets.webp" },
        { "id": "shrimp", "name": "Креветки в кляре", "desc": "", "price": 350, "options": [{ "name": "6 шт", "price": 350 }, { "name": "9 шт", "price": 480 }], "icon": "snack", "photo": "img/food/shrimp.webp" }
      ]
    },
    {
      "id": "wok",
      "title": "Вок и лапша",
      "note": "",
      "items": [
        { "id": "wok-rice", "name": "Вок с рисом", "desc": "", "price": 300, "icon": "noodles", "photo": "img/food/wok-rice.webp" },
        { "id": "udon", "name": "Удон лапша", "desc": "", "price": 300, "icon": "noodles", "photo": "img/food/udon-noodles.webp" },
        { "id": "chicken-wok", "name": "Чикен вок", "desc": "", "price": 330, "icon": "noodles", "photo": "img/food/chicken-wok.webp" }
      ]
    },
    {
      "id": "hot",
      "title": "Горячее",
      "note": "",
      "items": [
        { "id": "tortilla-cheese", "name": "Сырная тортилья", "desc": "", "price": 350, "icon": "plate", "photo": "img/food/tortilla-cheese.webp" },
        { "id": "tortilla-salad", "name": "Тортилья с салатом", "desc": "", "price": 350, "icon": "plate", "photo": "img/food/tortilla-salad.webp" },
        { "id": "mexican", "name": "Мексиканец", "desc": "", "price": 350, "icon": "plate", "photo": "img/food/mexican.webp" },
        { "id": "giro", "name": "Гиро", "desc": "", "price": 350, "icon": "plate", "photo": "img/food/giro.webp" },
        { "id": "chicken-slice", "name": "Чикен-слайс на мангале", "desc": "", "price": 380, "icon": "plate", "photo": "img/food/chicken-slice.webp" }
      ]
    },
    {
      "id": "salads",
      "title": "Салаты",
      "note": "",
      "items": [
        { "id": "salad-fresh", "name": "Свежий салат", "desc": "", "price": 230, "icon": "salad", "photo": "img/food/salad-fresh.webp" },
        { "id": "caesar", "name": "Цезарь", "desc": "", "price": 250, "icon": "salad", "photo": "img/food/caesar.webp" },
        { "id": "poke", "name": "Салат Поке", "desc": "Огурец, помидор, креветки, лосось, икра, сыр, авокадо, соус.", "price": 400, "icon": "salad", "photo": "img/food/poke.webp" }
      ]
    }
  ]
};
