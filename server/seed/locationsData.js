export const SEED_LOCATIONS = [
  {
    id: "wielka-sala",
    name: "Wielka Sala Uczt i Edyktów",
    nordic_name: "Hrafnhöll",
    floor: 0,
    x: 50,
    y: 44,
    icon: "🏰",
    house: null,
    type: "Serce Cytadeli",
    region: "Centralna Twierdza",
    image: "grand-hall",
    short_desc: "Monumentalna bazylika z czarnego granitu z paleniskiem runicznym i czterema długimi stołami Zakonów.",
    full_lore: `Wielka Sala jest centrum życia Cytadeli Durmstrang. Sklepienie z surowego ciosanego granitu zdobią wiszące sztandary czterech Zakonów oraz runiczne żyrandole z kutego żelaza, w których płoną wieczne, błękitno-złote płomienie.
W centralnej części sali znajduje się Kamień Przysięgi Założycieli — to tutaj odbywają się Uczty Otwarcia Sezonu, odczytywanie edyktów dyrektorskich oraz doroczne ceremonie przyznania Pucharu Północy.`,
    npcs: JSON.stringify(["Arcymistrzyni Valgerda Storm","Mistrz Ceremonii Brokk"]),
    actions: JSON.stringify(["Wysłuchaj edyktu dyrekcji","Sprawdź stan Klepsydr Zakonów","Zasiądź przy stole swojego Zakonu"]),
    secret_clue: "Wypukła runa na północnym filarze Kamienia Przysięgi reaguje na dotyk adepta noszącego pierścień ze srebra.",
    quests: JSON.stringify([
      {
            "id": "quest-wielka-sala-kamien",
            "title": "Pieczęć Kamienia Przysięgi",
            "category": "Rytuały & Historia",
            "difficulty": "Średni",
            "discordChannel": "#wielka-sala-edykty",
            "reward": {
                  "points": 15,
                  "xp": 50,
                  "galleons": 8,
                  "item": "Srebrna Odznaka Przysięgi"
            },
            "description": "Kamień Przysięgi Założycieli zaczął pulsować chłodnym, kobaltowym światłem. Mistrz Ceremonii Brokk szuka adepta zdolnego odczytać ukryty pod płaskorzeźbą edykt.",
            "initialBotMessage": "🏰 **[CYTADELA BOT - SEKTOR: WIELKA SALA]**\nStoisz przed monolitem z czarnego granitu. Płomienie w kandelabrach przygasają do błękitu.\n*„Kto dotyka Kamienia Przysięgi bez znajomości prastarej formuły milczenia, poczuje mróz w kościach.”*\n\nWybierz działanie lub rzuć zaklęcie w wątku:",
            "suggestedActions": [
                  {
                        "label": "🕯️ Dotknij runy Tiwaz",
                        "cmd": "/dotknij runa-tiwaz"
                  },
                  {
                        "label": "📜 Wypowiedz formułę: Silentium Borealis",
                        "cmd": "/inkantacja Silentium Borealis"
                  },
                  {
                        "label": "🎲 Test Wiedzy o Pradawnych (K20)",
                        "cmd": "/rzut k20 wiedza"
                  }
            ],
            "solutionKeywords": [
                  "silentium",
                  "tiwaz",
                  "przysiega",
                  "arktyk",
                  "revelio",
                  "lumos"
            ],
            "successMessage": "✨ Runa rozbłysła złotym blaskiem! Ze szczeliny wysuwa się zwój z zapomnianym edyktem Neridy Vulchanovej. Twój Zakon zdobywa punkty!",
            "failMessage": "❄️ Błędny gest! Kamień pokrywa się warstwą szronu, odpychając twoją dłoń lodową falą uderzeniową."
      }
]),
    sort_order: 1
  },
  {
    id: "wieza-kruka",
    name: "Wieża Nocnych Szeptów (Zakon Kruka)",
    nordic_name: "Hrafnturn",
    floor: 2,
    x: 58,
    y: 36,
    icon: "🦅",
    house: "kruk",
    type: "Dormitorium & Obserwatorium",
    region: "Wschodnie Iglicy",
    image: "raven-tower",
    short_desc: "Najwyższa, smukła iglica sięgająca ponad chmury, mieszcząca dormitoria Kruka i bibliotekę nekromancji.",
    full_lore: `Wieża Kruka jest bastionem wiedzy tajemnej, wróżbiarstwa i nekromancji. Z jej szczytu rozpościera się widok na całe pasmo Skandów i lodowe fiordy.
Wnętrze wieży wyłożone jest ciemnym ametystem i regałami z zakazanymi grimuarami. Czas płynie tu inaczej — wahadła zegarów astronomicznych odmierzają nie godziny, lecz koniunkcje gwiazd i pływy cieni.`,
    npcs: JSON.stringify(["Prof. Morana Vane","Duch Skalda Einara"]),
    actions: JSON.stringify(["Studiuj zakazane zwoje nekromancji","Obserwuj trajektorię kruków","Wejdź do dormitorium Zakonu Kruka"]),
    secret_clue: "W nocy nowiu na siódmym stopniu schodów spiralnych pojawia się widmowy pergamin.",
    quests: JSON.stringify([
      {
            "id": "quest-wieza-kruka-widmo",
            "title": "Widmowe Echa Skalda Einara",
            "category": "Nekromancja & Eteryczność",
            "difficulty": "Trudny",
            "discordChannel": "#wieza-nocnych-szeptow",
            "reward": {
                  "points": 25,
                  "xp": 90,
                  "galleons": 15,
                  "item": "Pióro Kruka Cienia"
            },
            "description": "Duch Skalda Einara zawodzi na szczycie wieży, gubiąc wersy swojej pieśni o upadku lodowej fortecy. Tylko adept o silnej woli potrafi nawiązać z nim kontakt astralny.",
            "initialBotMessage": "🦅 **[CYTADELA BOT - SEKTOR: WIEŻA NOCNYCH SZEPTÓW]**\nPomiędzy ametystowymi kolumnami unosi się przejrzysta zjawa wikinga z lutnią ze srebrnego świerku.\n*„Zabrakło mi słowa na określenie północnego wiatru niosącego duszę wojownika... Podpowiedz mi, adepcie!”*",
            "suggestedActions": [
                  {
                        "label": "👻 Rzuć zaklęcie: Vox Umbrae",
                        "cmd": "/rzuc Vox Umbrae"
                  },
                  {
                        "label": "🎵 Odpowiedz: Vindr Dauðra",
                        "cmd": "/odpowiedz Vindr Dauðra"
                  },
                  {
                        "label": "🎲 Test Inteligencji & Run (K20)",
                        "cmd": "/rzut k20 inteligencja"
                  }
            ],
            "solutionKeywords": [
                  "vindr",
                  "vox",
                  "umbra",
                  "cien",
                  "einar",
                  "piesn",
                  "dusza"
            ],
            "successMessage": "🌌 Duch Einara uderza w struny lutni, a w powietrzu materializują się srebrne nuty pieśni. Widmo kłania się z szacunkiem i nagradza cię runicznym artefaktem!",
            "failMessage": "💨 Chłodny powiew rozwiewa zjawę, która z szyderczym śmiechem znika w szczelinach wieży."
      }
]),
    sort_order: 2
  },
  {
    id: "sala-renifera",
    name: "Sala Rodowa Skandzy (Zakon Renifera)",
    nordic_name: "Hreindýrahöll",
    floor: 1,
    x: 18,
    y: 48,
    icon: "🦌",
    house: "renifer",
    type: "Dormitorium & Sala Rytuałów",
    region: "Zachodni Most & Kurhany",
    image: "reindeer-hall",
    short_desc: "Komnata wyciosana w litej skale tundrowej, ozdobiona prastarymi porożami i ogrzewana wiecznym ogniem.",
    full_lore: `Siedziba Zakonu Renifera emanuje ciepłem wiecznego paleniska i surowym honorem starych klanów północy. Ściany pokryte są płaskorzeźbami przedstawiającymi wędrówki pierwszych szamanów i rytuały krwi.
To tutaj młodzi adepci uczą się sztuki przetrwania, pieśni ochronnych i niezłomnej lojalności wobec braci i sióstr z Zakonu.`,
    npcs: JSON.stringify(["Prof. Sigrid Hällström","Strażnik Ognia Hallbjörn"]),
    actions: JSON.stringify(["Złóż dar z jałowca do wiecznego ognia","Odsłuchaj sagę przodków","Odwiedź dormitorium Zakonu Renifera"]),
    secret_clue: "Pod czaszką pra-renifera znajduje się ukryta skrytka z prastarym medalionem.",
    quests: JSON.stringify([
      {
            "id": "quest-sala-renifera-ogien",
            "title": "Dar Świętego Jałowca dla Wiecznego Płomienia",
            "category": "Szamanizm & Przetrwanie",
            "difficulty": "Łatwy",
            "discordChannel": "#sala-rodowa-reinhall",
            "reward": {
                  "points": 10,
                  "xp": 40,
                  "galleons": 5,
                  "item": "Węglik Wiecznego Ciepła"
            },
            "description": "Wieczny Ogień Hallbjörna zaczyna dogasać z powodu lodowego szkwału. Wymagane jest złożenie rytu z suszonych ziół tundrowych i zaintonowanie pieśni ochrony.",
            "initialBotMessage": "🦌 **[CYTADELA BOT - SEKTOR: REINHALL]**\nPalenisko syczy i dymi sinym dymem. Strażnik Ognia Hallbjörn spogląda na ciebie surowym wzrokiem.\n*„Potrzebujemy żywicy sosny syberyjskiej i właściwej intencji. Czy twoja wola jest czysta jak polarny lód?”*",
            "suggestedActions": [
                  {
                        "label": "🌿 Wrzuć gałązkę jałowca",
                        "cmd": "/uzyj galazka-jalowca"
                  },
                  {
                        "label": "🔥 Rzuć zaklęcie: Ignis Borealis",
                        "cmd": "/rzuc Ignis Borealis"
                  },
                  {
                        "label": "🎲 Test Hartu Ducha (K20)",
                        "cmd": "/rzut k20 duch"
                  }
            ],
            "solutionKeywords": [
                  "ignis",
                  "jalowiec",
                  "ogien",
                  "zywica",
                  "incendio",
                  "borealis"
            ],
            "successMessage": "🔥 Płomień wystrzela pod samo sklepienie, a ciepło rozlewa się po całej sali. Strażnik z uznaniem uderza pięścią w pierś w geście szacunku!",
            "failMessage": "💨 Z paleniska bucha gęsty dym gryzący w oczy. Musisz spróbować ponownie po oczyszczeniu myśli."
      }
]),
    sort_order: 3
  },
  {
    id: "twierdza-niedzwiedzia",
    name: "Twierdza Żelaznego Pazura (Zakon Niedźwiedzia)",
    nordic_name: "Bjarnarvirki",
    floor: 0,
    x: 68,
    y: 68,
    icon: "🐻",
    house: "niedzwiedz",
    type: "Dormitorium & Kuźnia Wojenna",
    region: "Południowo-Wschodnia Kuźnia",
    image: "bear-fortress",
    short_desc: "Masywny, żelazny bastion z kuźniami runicznymi i areną pojedynkową w wykutej grocie.",
    full_lore: `Bastion Zakonu Niedźwiedzia to forteca wewnątrz fortecy. Powietrze pachnie tu żelazem, siarką i dymem palonych ziół bojowych.
Adepci Niedźwiedzia rozpoczynają każdy świt od treningu w zwarciu i rzucania tarcz ciśnieniowych. Na środku sali stoi Wielkie Kowadło Torvalda, na którym wykuwane są magiczne pancerze i wzmacniane różdżki.`,
    npcs: JSON.stringify(["Prof. Gunnar Vargson","Kowal Runiczny Kveldulf"]),
    actions: JSON.stringify(["Sprawdź siłę uderzenia na manekinie żelaznym","Wykuj runę na rękawicy bojowej","Wejdź do bastionu Niedźwiedzia"]),
    secret_clue: "Uderzenie w lewy róg kowadła różdżką bojową otwiera przejście do zbrojowni.",
    quests: JSON.stringify([
      {
            "id": "quest-twierdza-niedzwiedzia-kowadlo",
            "title": "Próba Młota i Runicznego Żelaza",
            "category": "Kowalstwo Bojowe",
            "difficulty": "Średni",
            "discordChannel": "#twierdza-bjornhall",
            "reward": {
                  "points": 20,
                  "xp": 75,
                  "galleons": 12,
                  "item": "Żelazny Runiczny Szpon"
            },
            "description": "Kowal Kveldulf potrzebuje adepta o silnym ramieniu i precyzyjnym skupieniu do zakucia runy Thurisaz w ostrze ceremonialnego topora.",
            "initialBotMessage": "🐻 **[CYTADELA BOT - SEKTOR: BJÖRNHALL KUŹNIA]**\nŻar z paleniska bije w twarz, a dźwięk uderzeń młota o kowadło niesie się echem po kamiennych korytarzach.\n*„Ostrze ostygnie za trzy uderzenia serca! Wymierz cios z właściwym skupieniem woli!”*",
            "suggestedActions": [
                  {
                        "label": "🔨 Uderz młotem runicznym w punkt skupienia",
                        "cmd": "/uderz mlot-runiczny"
                  },
                  {
                        "label": "⚡ Rzuć zaklęcie hartujące: Duro Ferro",
                        "cmd": "/rzuc Duro Ferro"
                  },
                  {
                        "label": "🎲 Test Siły i Dyscypliny (K20)",
                        "cmd": "/rzut k20 sila"
                  }
            ],
            "solutionKeywords": [
                  "duro",
                  "mlot",
                  "thurisaz",
                  "uderz",
                  "hartuj",
                  "zelazo",
                  "ferro"
            ],
            "successMessage": "⚡ Snopy iskier wypełniają kuźnię, a na stali pojawia się perfekcyjna runa Thurisaz świecąca szkarłatem. Kveldulf klepie cię w plecy: Dobra robota!",
            "failMessage": "💥 Ostrze pęka z głośnym trzaskiem. Kowal kręci głową: Zbyt mało skupienia w chwili uderzenia."
      }
]),
    sort_order: 4
  },
  {
    id: "podziemia-wydry",
    name: "Ogrody Lodowych Cieplic (Zakon Wydry)",
    nordic_name: "Otragarðar",
    floor: -1,
    x: 74,
    y: 78,
    icon: "🦦",
    house: "wydra",
    type: "Dormitorium & Laboratoria",
    region: "Geotermalne Doliny Wyrmwood",
    image: "otter-springs",
    short_desc: "Podziemne groty z naturalnymi źródłami geotermalnymi, bujną roślinnością arktyczną i laboratoriami alchemicznymi.",
    full_lore: `Ukryte pod fundamentami zamku Ogrody Wydry to cud inżynierii magicznej. Ciepło wulkanicznych żył termalnych spotyka się tu z lodową wodą fiordów, tworząc mikroklimat sprzyjający uprawie najrzadszych ziół i prowadzeniu ryzykownych eksperymentów.
W dormitoriach słychać kojący szum krystalicznych wodospadów, a z probówek unoszą się fluorescencyjne opary.`,
    npcs: JSON.stringify(["Prof. Klaus Lindqvist","Mistrzyni Ziół Astrid"]),
    actions: JSON.stringify(["Zmieszaj ekstrakt w retorcie geotermalnej","Zbierz liście świetlistej tojeści","Odwiedź komnaty Zakonu Wydry"]),
    secret_clue: "W trzeciej niecce źródlanej na dnie spoczywa szklany flakon ze skondensowanym światłem zorzy.",
    quests: JSON.stringify([
      {
            "id": "quest-ogrody-wydry-destylacja",
            "title": "Geotermalna Destylacja Świetlistej Tojeści",
            "category": "Zaawansowana Alchemia",
            "difficulty": "Średni",
            "discordChannel": "#ogrody-cieplic-otergard",
            "reward": {
                  "points": 15,
                  "xp": 65,
                  "galleons": 10,
                  "item": "Flakon Wody Zorzy"
            },
            "description": "Temperatura w trzeciej komorze retorty wulkanicznej gwałtownie wzrosła. Należy ustabilizować ciśnienie lodowym kryształem i zebrać destylat.",
            "initialBotMessage": "🦦 **[CYTADELA BOT - SEKTOR: OTERGARD CIEPLICE]**\nSzmaragdowa para bulgocze w szklanych wężownicach. Mistrzyni Astrid gorączkowo obserwuje barometr parowy.\n*„Szybko! Jeśli ciśnienie wzrośnie o 2 jednostki runiczne, rozerwie retorftę z wyciągiem z tojeści!”*",
            "suggestedActions": [
                  {
                        "label": "🧊 Schłodź kocioł zaklęciem: Glacius",
                        "cmd": "/rzuc Glacius"
                  },
                  {
                        "label": "🧪 Otwórz zawór dekompresyjny nr 3",
                        "cmd": "/uzyj zawor-nr3"
                  },
                  {
                        "label": "🎲 Test Precyzji Alchemicznej (K20)",
                        "cmd": "/rzut k20 zrecznosc"
                  }
            ],
            "solutionKeywords": [
                  "glacius",
                  "zawor",
                  "chlodz",
                  "stabilizuj",
                  "destyluj",
                  "tojesz"
            ],
            "successMessage": "🧪 Ciecz w kolbie zmienia barwę na czyste, świetliste złoto. Retorta bezpiecznie odprowadza nadmiar pary. Otrzymujesz eliksir czystego ekstraktu!",
            "failMessage": "💨 Zbyt gwałtowne schłodzenie spowodowało wykrystalizowanie osadu. Mikstura straciła właściwości."
      }
]),
    sort_order: 5
  },
  {
    id: "zakazana-biblioteka",
    name: "Wielka Biblioteka & Archiwum Runiczne",
    nordic_name: "Skráasafn",
    floor: 1,
    x: 44,
    y: 40,
    icon: "📚",
    house: null,
    type: "Kolekcja Wiedzy",
    region: "Skrzydło Zachodnie Zamku",
    image: "library",
    short_desc: "Labirynt gotyckich regałów sięgających 20 metrów wysokości, strzeżony przez kamienne gargulce.",
    full_lore: `Archiwum Cytadeli zawiera ponad czterdzieści tysięcy zwojów pergaminowych, tablic runicznych i zakazanych grimuarów. Część ksiąg jest przykuta do żelaznych pulpitów ciężkimi łańcuchami ze srebra, by uniemożliwić ich samowolne otwarcie lub ucieczkę.
W Dziale Ksiąg Zapomnianych badane są teksty z czasów przed powstaniem Międzynarodowego Kodeksu Tajności.`,
    npcs: JSON.stringify(["Kustosz Torben Ebbesen","Cień Skryby Thora"]),
    actions: JSON.stringify(["Szukaj wskazówek do zadań domowych","Odczytaj staronordycki manuskrypt","Zbadaj zamknięty Dział Ksiąg Zapomnianych"]),
    secret_clue: "Księga o tytule „Czarne Skrzydła Nad Nidaros” po pociągnięciu odchyla cały segment regału.",
    quests: JSON.stringify([
      {
            "id": "quest-biblioteka-zakazany-dzial",
            "title": "Szyfr Srebrnych Łańcuchów Grimuaru",
            "category": "Starożytne Runy & Zagadki",
            "difficulty": "Trudny",
            "discordChannel": "#archiwum-runiczne-skraasafn",
            "reward": {
                  "points": 30,
                  "xp": 110,
                  "galleons": 20,
                  "item": "Złota Zakładka Kustosza"
            },
            "description": "Jeden z grimuarów w Dziale Zapomnianym szarpie się na srebrnych łańcuchach. Z okładki wyziera świecący runiczny rebus: ᚠ - ᚢ - ᚦ - ᚨ - ᚱ - ᚲ.",
            "initialBotMessage": "📚 **[CYTADELA BOT - SEKTOR: ARCHIWUM RUNICZNE]**\nKustosz Torben stoi z wyciągniętą różdżką, powstrzymując kłapiącą zębami oprawnymi w żelazo księgę.\n*„Księga wymaga ułożenia runicznego hasła w porządku starszego Futharku! Pomożesz mi uśpić jej szał?”*",
            "suggestedActions": [
                  {
                        "label": "📜 Odczytaj pierwszą trójkę: Fehu-Uruz-Thurisaz",
                        "cmd": "/haslo Fehu-Uruz-Thurisaz"
                  },
                  {
                        "label": "💤 Rzuć zaklęcie usypiające: Dormio Grimoire",
                        "cmd": "/rzuc Dormio Grimoire"
                  },
                  {
                        "label": "🎲 Test Wiedzy Runicznej (K20)",
                        "cmd": "/rzut k20 runy"
                  }
            ],
            "solutionKeywords": [
                  "fehu",
                  "uruz",
                  "thurisaz",
                  "futhark",
                  "dormio",
                  "uśpij",
                  "ansuz"
            ],
            "successMessage": "📖 Łańcuchy cichną, a księga miękko opada na pulpit, odsłaniając zapomniany rozdział o magii północy. Kustosz zapisuje twoje imię w księdze zasłużonych!",
            "failMessage": "📚 Księga zaciska swoje szczęki i emituje falę uderzeniową, przewracając stos zwojów z pobliskiego biurka."
      }
]),
    sort_order: 6
  },
  {
    id: "krypta-rytualow",
    name: "Krypta Siedmiu Kręgów Rytualnych",
    nordic_name: "Grafhvelfing",
    floor: -1,
    x: 82,
    y: 56,
    icon: "🕯️",
    house: null,
    type: "Miejsce Mocy",
    region: "Wschodnie Monolity Eldritch",
    image: "crypt",
    short_desc: "Pradawna podziemna krypta z kręgami wyrytymi w bazalcie, w której odbywają się najpotężniejsze ceremonie.",
    full_lore: `Położona w najgłębszym punkcie Cytadeli, bezpośrednio na przecięciu linii geomantycznych północy. Tutaj odbywa się Ceremonia Przebudzenia Mocy i składanie przysiąg adepckich.
Temperatura w krypcie nigdy nie przekracza zera, a ściany pokryte są grubą warstwą szronu, na którym samoczynnie układają się wzory zórz polarnych.`,
    npcs: JSON.stringify(["Arcymistrz Rytuałów Harald","Strażnicy Bramy Śmierci"]),
    actions: JSON.stringify(["Medytuj w centralnym kręgu runicznym","Zapoznaj się z pradawnymi inskrypcjami","Wyczuj przepływ energii geomantycznej"]),
    secret_clue: "W centralnym punkcie pod szronem wyryta jest pierwotna Runa Odyna.",
    quests: JSON.stringify([
      {
            "id": "quest-krypta-geometria",
            "title": "Przepływ Linii Geomantycznych",
            "category": "Rytuały & Geomancja",
            "difficulty": "Arcymistrzowski",
            "discordChannel": "#krypta-siedmiu-kregow",
            "reward": {
                  "points": 35,
                  "xp": 130,
                  "galleons": 25,
                  "item": "Kryształ Północnej Zorzy"
            },
            "description": "Siedem kręgów runicznych przestało rezonować w unisonie. Należy stanąć w centrum i połączyć energię żywiołów za pomocą kryształu skupiającego.",
            "initialBotMessage": "🕯️ **[CYTADELA BOT - SEKTOR: KRYPTA RYTUALNA]**\nŚciany pokrywa pulsujący szron w kolorze fioletu i szmaragdu.\n*„Siedem kręgów czeka na adepta o nienagannej koncentracji. Rzuć zaklęcie harmonizujące węzły geomagnetyczne.”*",
            "suggestedActions": [
                  {
                        "label": "🌀 Rzuć zaklęcie: Harmonisa Telluris",
                        "cmd": "/rzuc Harmonisa Telluris"
                  },
                  {
                        "label": "💎 Umieść kryształ w punkcie centralnym",
                        "cmd": "/uzyj krysztal-centrum"
                  },
                  {
                        "label": "🎲 Test Rytualnej Medytacji (K20)",
                        "cmd": "/rzut k20 medytacja"
                  }
            ],
            "solutionKeywords": [
                  "harmonisa",
                  "telluris",
                  "krysztal",
                  "centrum",
                  "geomancja",
                  "medytacja"
            ],
            "successMessage": "🌌 Wszystkie siedem kręgów rozbłysło oślepiającym słupem światła zorzy, wznoszącym się aż do wież zamku! Twoja moc została zauważona przez Radę Magii.",
            "failMessage": "❄️ Niestabilny rezonans wywołuje falę chłodu gaszącą wszystkie rytualne znicze."
      }
]),
    sort_order: 7
  },
  {
    id: "arena-pojedynkowa",
    name: "Arena Lodowego Kręgu (Plac Bojowy)",
    nordic_name: "Hólmganga",
    floor: 0,
    x: 35,
    y: 62,
    icon: "⚔️",
    house: null,
    type: "Trening Bojowy",
    region: "Południowo-Zachodni Bastion",
    image: "dueling-arena",
    short_desc: "Okrągły plac otoczony lodowymi pylonami ochronnymi, gdzie kadeci toczą oficjalne pojedynki magiczne.",
    full_lore: `Oficjalne miejsce turniejów Hólmganga — tradycyjnych nordyckich pojedynków czarodziejów. Pylony runiczne absorbują zaklęcia niszczące, zapobiegając uszkodzeniu murów twierdzy.
Kadeci uczą się tu bezwzględnej dyscypliny taktycznej, walki bezróżdżkowej oraz łączenia magii żywiołów lodu i ognia.`,
    npcs: JSON.stringify(["Instruktor Bojowy Viktor Storm","Sędzia Pojedynkowy Olaf"]),
    actions: JSON.stringify(["Wyzwij adepta innego Zakonu na pojedynek","Trenuj odparcie klątw uderzeniowych","Obserwuj ligę pojedynkową"]),
    secret_clue: "Pod trzecią płytą areny wyryto runę Tiwaz zwiększającą refleks.",
    quests: JSON.stringify([
      {
            "id": "quest-arena-holmganga-pojedynek",
            "title": "Turniejowy Pojedynek Hólmganga",
            "category": "Pojedynki Czarodziejów",
            "difficulty": "Średni",
            "discordChannel": "#arena-lodowego-kregu",
            "reward": {
                  "points": 20,
                  "xp": 80,
                  "galleons": 12,
                  "item": "Złoty Glejt Fechtunku"
            },
            "description": "Instruktor Viktor Storm rzuca wyzwanie: odeprzyj potrójną salwę lodowych pocisków i odpowiedz precyzyjnym zaklęciem rozbrajającym.",
            "initialBotMessage": "⚔️ **[CYTADELA BOT - SEKTOR: ARENA HÓLMGANGA]**\nManekin treningowy z czarnego dębu unosi różdżkę. Pylony areny jarzą się na czerwono.\n*„Trzy... dwa... jeden... INCIPIO! Manekin wystrzeliwuje lodowy pocisk!”*",
            "suggestedActions": [
                  {
                        "label": "🛡️ Tarcza Protego Borealis",
                        "cmd": "/rzuc Protego Borealis"
                  },
                  {
                        "label": "⚡ Kontratak: Expelliarmus",
                        "cmd": "/rzuc Expelliarmus"
                  },
                  {
                        "label": "🎲 Test Refleksu Bojowego (K20)",
                        "cmd": "/rzut k20 refleks"
                  }
            ],
            "solutionKeywords": [
                  "protego",
                  "expelliarmus",
                  "tarcza",
                  "unik",
                  "kontra",
                  "glacius",
                  "depulso"
            ],
            "successMessage": "💥 Tarcza absorbuje uderzenie, a twoja riposta wytrąca różdżkę manekina prosto w dłonie instruktora Storma. Brawo kadecie!",
            "failMessage": "🧊 Nie zdążyłeś postawić tarczy — lodowy pocisk odrzuca cię na barierę ochronną pylonu."
      }
]),
    sort_order: 8
  },
  {
    id: "zakazany-bor",
    name: "Zakazany Bór Mroźnych Wilków",
    nordic_name: "Jötunskógr",
    floor: 0,
    x: 28,
    y: 34,
    icon: "🌲",
    house: null,
    type: "Dzika Północ",
    region: "Jötunskógr Forest",
    image: "forbidden-forest",
    short_desc: "Nieprzebyta, gęsta puszcza arktyczna zamieszkana przez stada wilków mroźnych i prastare trolle.",
    full_lore: `Las otaczający Cytadelę od północy i zachodu. Drzewa osiągają tu gigantyczne rozmiary, a ich kora jest twarda jak stal. W głębi lasu ukryte są ruiny pierwszych sanktuariów z czasów wikingów oraz siedliska stworzeń nieznanych w Europie Zachodniej.
Wstęp do lasu dozwolony jest wyłącznie pod opieką profesora lub podczas oficjalnych ekspedycji magizoologicznych.`,
    npcs: JSON.stringify(["Gajowy Stellan Varg","Stado Wilków Frostúlf"]),
    actions: JSON.stringify(["Szukaj śladów bestii polarnych","Zbierz żywicę z żelaznej sosny","Zbadaj kamienny kurhan"]),
    secret_clue: "W pniu najstarszego dębu tundrowego ukryto runiczny talizman pasterza bestii.",
    quests: JSON.stringify([
      {
            "id": "quest-zakazany-bor-tropiciel",
            "title": "Tropem Alfy Mroźnych Wilków",
            "category": "Magizoologia & Przetrwanie",
            "difficulty": "Trudny",
            "discordChannel": "#jotunskog-zakazany-bor",
            "reward": {
                  "points": 30,
                  "xp": 100,
                  "galleons": 18,
                  "item": "Kieł Mroźnego Wilka"
            },
            "description": "Gajowy Stellan Varg zauważył ślady rzadkiego alfy Frostúlfa w pobliżu pradawnego kurhanu. Zwierzę jest niespokojne przez lodową anomalię.",
            "initialBotMessage": "🌲 **[CYTADELA BOT - SEKTOR: JÖTUNSKÓGR]**\nŚnieg skrzypi pod butami. W gęstwinie sosen widać parę świecących na błękitno ślepi potężnego wilka polarnym.\n*„Cicho... nie wykonuj gwałtownych ruchów. Pokaż mu, że nie masz wrogich zamiarów.”*",
            "suggestedActions": [
                  {
                        "label": "🍖 Rzuć przysmak z suszonego mięsa",
                        "cmd": "/uzyj przysmak-mieso"
                  },
                  {
                        "label": "🐾 Użyj mowy zwierząt: Feratalk",
                        "cmd": "/rzuc Feratalk"
                  },
                  {
                        "label": "🎲 Test Oswajania Bestii (K20)",
                        "cmd": "/rzut k20 oswajanie"
                  }
            ],
            "solutionKeywords": [
                  "feratalk",
                  "przysmak",
                  "mieso",
                  "spokoj",
                  "glaskaj",
                  "wilk",
                  "lumos"
            ],
            "successMessage": "🐺 Wilk podchodzi powoli, wącha twoją dłoń i opuszcza głowę w geście zaufania. Zostawia przy tobie kawałek starożytnego kryształu i znika w gęstwinie!",
            "failMessage": "❄️ Wilk warczy groźnie, kłapiąc szczękami i zmuszając cię do natychmiastowego odwrotu za linię pylonów obronnych."
      }
]),
    sort_order: 9
  },
  {
    id: "podziemne-jezioro",
    name: "Lodowe Jezioro & Przystań Drakkarów",
    nordic_name: "Kaldavatn",
    floor: -1,
    x: 24,
    y: 76,
    icon: "⛵",
    house: null,
    type: "Przystań & Wody",
    region: "Zatoka Fiordgard & Icy Fjords",
    image: "ice-lake",
    short_desc: "Czarna, lodowata woda fiordu wpływająca do podziemnej jaskini, gdzie cumuje legendarny magiczny drakkar.",
    full_lore: `To tutaj przybywają nowi kadeci na pokładzie zaczarowanego okrętu z czarnymi żaglami, który potrafi żeglować pod powierzchnią lodowców.
W głębinach jeziora żyją kelpie fiordowe oraz gigantyczna kałamarnica północna, która według legend strzeże wejścia do zatopionych krypt pierwszych królów magii.`,
    npcs: JSON.stringify(["Sternik Drakkara Sven","Syrena Lodowa Astrid"]),
    actions: JSON.stringify(["Spójrz w czarne głębiny fiordu","Zbadaj drewno magicznego drakkara","Rzuć monetę na pomyślność rejsu"]),
    secret_clue: "Przy pomoście na łańcuchu kotwicznym wisi mosiężny klucz z pieczęcią Neridy Vulchanovej.",
    quests: JSON.stringify([
      {
            "id": "quest-drakkar-kotwica",
            "title": "Pieczęć Zatopionej Kotwicy Neridy",
            "category": "Magia Wodna & Eksploracja",
            "difficulty": "Średni",
            "discordChannel": "#przystan-drakkarow-kaldavatn",
            "reward": {
                  "points": 20,
                  "xp": 70,
                  "galleons": 15,
                  "item": "Złoty Talizman Fiordu"
            },
            "description": "Na dnie fiordu, w pobliżu kadłuba magicznego drakkara, rozbłysła stara kotwica założycielki. Syrena Astrid kusi zagadką głębin.",
            "initialBotMessage": "⛵ **[CYTADELA BOT - SEKTOR: PRZYSTAŃ KALDAVATN]**\nCzarne wody fiordu falują delikatnie, a mgła unosi się nad pokładem drakkara.\n*„Cztery wiatry dmą w żagiel czarny, lecz tylko jeden odepchnie prąd cieni. Jaki to wiatr?”*",
            "suggestedActions": [
                  {
                        "label": "🌬️ Odpowiedz: Wiatr Północy (Norðan)",
                        "cmd": "/odpowiedz Nordan"
                  },
                  {
                        "label": "🌊 Rzuć zaklęcie nurkowania: Bubble-Head",
                        "cmd": "/rzuc Bubble-Head"
                  },
                  {
                        "label": "🎲 Test Zrozumienia Żywiołu Wody (K20)",
                        "cmd": "/rzut k20 woda"
                  }
            ],
            "solutionKeywords": [
                  "nordan",
                  "polnoc",
                  "bubble",
                  "aquamenti",
                  "nurkuj",
                  "syrena"
            ],
            "successMessage": "🌊 Syrena wynurza się z uśmiechem i podaje ci mosiężny medalion wyłowiony z zatopionej skrytki pod drakkarem!",
            "failMessage": "💦 Woda fiordu wzburza się, ochlapując cię lodowatą falą."
      }
]),
    sort_order: 10
  },
  {
    id: "obserwatorium-polnocne",
    name: "Obserwatorium Zórz i Ciał Niebieskich",
    nordic_name: "Norðurljósaturn",
    floor: 2,
    x: 52,
    y: 15,
    icon: "🔭",
    house: null,
    type: "Kosmologia",
    region: "Szczyt Frostfang Mountains",
    image: "observatory",
    short_desc: "Wielka mosiężna kopuła ze spektakularnym teleskopem z kryształu górskiego do badania zórz polarnych.",
    full_lore: `Wyposażone w gigantyczny teleskop krasnoludzkiej roboty z soczewkami ze szlifowanego diamentu lodowego. Obserwatorium pozwala śledzić prądy geomagnetyczne oraz przewidywać noce, w których magia Cytadeli osiąga apogeum.`,
    npcs: JSON.stringify(["Prof. Stellan Nyström"]),
    actions: JSON.stringify(["Spójrz przez kryształowy teleskop","Zanotuj układ zórz polarnych","Skalibruj mosiężne astrolabium"]),
    secret_clue: "Ustawienie teleskopu na Gwiazdę Polarną pod kątem 64 stopni rzuca promień na ukrytą szufladę.",
    quests: JSON.stringify([
      {
            "id": "quest-obserwatorium-astrolabium",
            "title": "Kalibracja Astrolabium Siedmiu Gwiazd",
            "category": "Astronomia & Kosmologia",
            "difficulty": "Średni",
            "discordChannel": "#obserwatorium-zorz-nordurljos",
            "reward": {
                  "points": 20,
                  "xp": 85,
                  "galleons": 14,
                  "item": "Amulet Gwiazdy Polarnej"
            },
            "description": "Teleskop krasnoludzki wymaga zgrania z kątem deklinacji zorzy polarnej, aby odczytać mapę koniunkcji na nadchodzący semestr.",
            "initialBotMessage": "🔭 **[CYTADELA BOT - SEKTOR: OBSERWATORIUM]**\nMosiężne koła zębate skrzypią, a przez wielką szczelinę w kopule widać tańczącą szmaragdową zorzę.\n*„Podaj kąt nachylenia zwierciadła dla koniunkcji Skadi i Gwiazdy Północy!”*",
            "suggestedActions": [
                  {
                        "label": "📐 Ustaw kąt: 64 stopnie północ",
                        "cmd": "/kat 64"
                  },
                  {
                        "label": "✨ Rzuć zaklęcie skupiające: Focus Lumina",
                        "cmd": "/rzuc Focus Lumina"
                  },
                  {
                        "label": "🎲 Test Obliczeń Astronomicznych (K20)",
                        "cmd": "/rzut k20 astronomia"
                  }
            ],
            "solutionKeywords": [
                  "64",
                  "focus",
                  "lumina",
                  "polarna",
                  "zorza",
                  "astrolabium"
            ],
            "successMessage": "✨ Promień światła zorzy przechodzi przez soczewkę i rzuca na podłogę mapę gwiezdną! Prof. Nyström zapisuje twoje obliczenia.",
            "failMessage": "🔭 Obraz w okularze zamienia się w mgłę. Kąt zwierciadła był niedokładny."
      }
]),
    sort_order: 11
  },
  {
    id: "szklarnie-wiecznej-zmarzliny",
    name: "Szklarnie Wiecznej Zmarzliny",
    nordic_name: "Frostgróðurhús",
    floor: 0,
    x: 80,
    y: 72,
    icon: "🌿",
    house: null,
    type: "Ogrody Magiczne",
    region: "Południowe Cieplice Wyrmwood",
    image: "greenhouses",
    short_desc: "Kompleks szklanych kopuł ogrzewanych parą termalną, mieszczący rzadkie rośliny z koła podbiegunowego.",
    full_lore: `W szklarniach podtrzymywane są różne strefy klimatyczne: od wilgotnego boru tajgowego po tundrowe wrzosowiska. Hoduje się tu lodowe mandragory, których krzyk potrafi zamrozić krew w żyłach, oraz pnącza tojeściarktycznej.`,
    npcs: JSON.stringify(["Prof. Birgit Thorsen"]),
    actions: JSON.stringify(["Podlej mrozoodporną mandragorę","Zbierz liście tojeści","Zbadaj mikroklimat kopuły termalnej"]),
    secret_clue: "Za donicą z arktyczną paprocią ukryty jest stary dziennik botaniczny z 1782 roku.",
    quests: JSON.stringify([
      {
            "id": "quest-szklarnie-mandragora",
            "title": "Przesadzanie Lodowej Mandragory Polarnej",
            "category": "Zielarstwo Magiczne",
            "difficulty": "Średni",
            "discordChannel": "#szklarnie-zmarzliny",
            "reward": {
                  "points": 15,
                  "xp": 60,
                  "galleons": 10,
                  "item": "Liść Złotej Tojeści"
            },
            "description": "Lodowa mandragora potrzebuje nowej gleby z popiołu wulkanicznego. Uważaj na jej kriogeniczny krzyk!",
            "initialBotMessage": "🌿 **[CYTADELA BOT - SEKTOR: SZKLARNIE]**\nZ donicy dobiega głuche stukanie korzeni. Temperatura wokół rośliny spada poniżej zera.\n*„Załóż nauszniki z wełny renifera i przygotuj nawóz wulkaniczny!”*",
            "suggestedActions": [
                  {
                        "label": "🎧 Załóż nauszniki ochronne",
                        "cmd": "/uzyj nauszniki"
                  },
                  {
                        "label": "🌱 Przesadź do gleby wulkanicznej",
                        "cmd": "/akcja przesadz-ziemia-wulkaniczna"
                  },
                  {
                        "label": "🎲 Test Zręczności Zielarskiej (K20)",
                        "cmd": "/rzut k20 zielarstwo"
                  }
            ],
            "solutionKeywords": [
                  "nauszniki",
                  "wulkan",
                  "gleba",
                  "przesadz",
                  "mandragora",
                  "herbivicus"
            ],
            "successMessage": "🌱 Roślina bezpiecznie spoczywa w nowej donicy, a jej liście zaczynają wydzielać ciepłą, kojącą woń. Prof. Thorsen jest pod wrażeniem!",
            "failMessage": "❄️ Krzyk mandragory powoduje zamarznięcie wody w konewce! Musisz odczekać chwilę."
      }
]),
    sort_order: 12
  },
  {
    id: "gabinet-arcymistrzyni",
    name: "Gabinet Arcymistrza Cytadeli",
    nordic_name: "Meistarastofa",
    floor: 2,
    x: 50,
    y: 30,
    icon: "🦅",
    house: null,
    type: "Dyrekcja",
    region: "Wysoki Donżon Twierdzy",
    image: "headmaster-office",
    short_desc: "Majestatyczny gabinet ze sklepieniem łukowym, kominkiem z czarnego marmuru i portretami dawnych dyrektorów.",
    full_lore: `Siedziba najwyższej władzy w Cytadeli Durmstrang. Na ścianach wiszą ruszające się portrety Neridy Vulchanovej, Harfanga Muntera i Igora Karkarowa.
Na biurku z dębu skandynawskiego spoczywa Złota Księga Przyjęć, w której niewidzialnym atramentem pojawiają się imiona czarodziejów przeznaczonych do wstąpienia w mury Cytadeli.`,
    npcs: JSON.stringify(["Arcymistrzyni Valgerda Storm","Kruk Myśli Huginn"]),
    actions: JSON.stringify(["Złóż oficjalny wniosek do dyrekcji","Zapoznaj się z portretem założycielki Neridy","Poproś o audiencję"]),
    secret_clue: "W ramie portretu Harfanga Muntera znajduje się rzeźbiony mechanizm zegarowy.",
    quests: JSON.stringify([
      {
            "id": "quest-gabinet-zlota-ksiega",
            "title": "Atrament Prawdy w Złotej Księdze",
            "category": "Tajemnice Dyrekcji",
            "difficulty": "Arcymistrzowski",
            "discordChannel": "#gabinet-arcymistrza",
            "reward": {
                  "points": 40,
                  "xp": 150,
                  "galleons": 30,
                  "item": "Pióro z Gryfiego Skrzydła"
            },
            "description": "Arcymistrzyni Valgerda poszukuje adepta godnego przepisania tajnego edyktu założycielskiego za pomocą znikającego atramentu Północy.",
            "initialBotMessage": "🦅 **[CYTADELA BOT - SEKTOR: GABINET DYREKCJI]**\nW kominku trzaskają szmaragdowe płomienie. Kruk Huginn bacznie obserwuje każdy twój ruch z oparcia wielkiego fotela.\n*„Złota Księga otwiera się tylko przed tymi, którzy znają dewizę prawdziwej siły.”*",
            "suggestedActions": [
                  {
                        "label": "👑 Cytuj dewizę: Virtus in Glacie",
                        "cmd": "/dewiza Virtus in Glacie"
                  },
                  {
                        "label": "📜 Użyj Pióra Prawdy",
                        "cmd": "/uzyj pioro-prawdy"
                  },
                  {
                        "label": "🎲 Test Godności i Charyzmy (K20)",
                        "cmd": "/rzut k20 charyzma"
                  }
            ],
            "solutionKeywords": [
                  "virtus",
                  "glacie",
                  "pioro",
                  "ksiega",
                  "nerida",
                  "prawda"
            ],
            "successMessage": "✨ Złota Księga rozbłyska majestatycznym blaskiem, a twoje nazwisko pojawia się na liście wybitnych adeptów Cytadeli. Valgerda kłania się z uznaniem.",
            "failMessage": "📖 Strony księgi zatrzaskują się z głośnym hukiem. Dyrekcja oczekuje większej powagi."
      }
]),
    sort_order: 13
  },
  {
    id: "dziedziniec-glowny",
    name: "Dziedziniec Wilków & Monolity Przysięgi",
    nordic_name: "Úlfatorg",
    floor: 0,
    x: 48,
    y: 55,
    icon: "🐺",
    house: null,
    type: "Plac Zamkowy",
    region: "Główna Brama Twierdzy",
    image: "courtyard",
    short_desc: "Rozległy dziedziniec z czarnego bazaltu, otoczony blankami i rzeźbami wyjących wilków polarnych.",
    full_lore: `Główne miejsce zbiórek kadetów. Pod płytami dziedzińca przebiegają kanały grzewcze ze źródeł termalnych, dzięki czemu śnieg natychmiast topnieje w wyznaczonych kręgach paradnych.
Wokół stoją cztery kamienne monolity symbolizujące cztery Zakony.`,
    npcs: JSON.stringify(["Strażnik Bramy Einar","Grupa kadetów Zakonu Renifera"]),
    actions: JSON.stringify(["Sprawdź ogłoszenia na tablicy monolitów","Obserwuj zmianę warty strażników","Porozmawiaj z innymi kadetami"]),
    secret_clue: "Połączenie cieni czterech monolitów o godzinie 12:00 wskazuje punkt pod płytą bruku.",
    quests: JSON.stringify([
      {
            "id": "quest-dziedziniec-monolity",
            "title": "Cienie Czterech Monolitów",
            "category": "Geometria Magiczna",
            "difficulty": "Łatwy",
            "discordChannel": "#dziedziniec-wilkow",
            "reward": {
                  "points": 10,
                  "xp": 45,
                  "galleons": 6,
                  "item": "Okruch Czarnego Bazaltu"
            },
            "description": "Cztery monolity rzucają przecinające się cienie na bazaltowy bruk. Odszukaj punkt przecięcia i aktywuj ukrytą płytę.",
            "initialBotMessage": "🐺 **[CYTADELA BOT - SEKTOR: DZIEDZINIEC WILKÓW]**\nŚnieg pada na czarne płyty bazaltu. Wokół monolitów zbierają się kadeci przygotowujący się do wieczornego apelu.\n*„Odszukaj centralny punkt, w którym łączą się znaki czterech Zakonów!”*",
            "suggestedActions": [
                  {
                        "label": "🔍 Zbadaj centralną płytę bazaltową",
                        "cmd": "/badaj plyta-centrum"
                  },
                  {
                        "label": "✨ Rzuć zaklęcie: Revelio",
                        "cmd": "/rzuc Revelio"
                  },
                  {
                        "label": "🎲 Test Spostrzegawczości (K20)",
                        "cmd": "/rzut k20 percepcja"
                  }
            ],
            "solutionKeywords": [
                  "revelio",
                  "plyta",
                  "centrum",
                  "monolit",
                  "cien",
                  "zakon"
            ],
            "successMessage": "✨ Pod wpływem zaklęcia płyta odsuwa się, ukazując starą skrytkę z pieczęcią założycieli! Zdobywasz punkty dla Zakonu.",
            "failMessage": "🔍 Nic niezwykłego nie zauważasz. Spróbuj zmienić kąt patrzenia lub użyć mocniejszego czaru."
      }
]),
    sort_order: 14
  },
  {
    id: "katakumby-cienia",
    name: "Katakumby Cienia & Lochy Kary",
    nordic_name: "Skuggadýflissur",
    floor: -1,
    x: 42,
    y: 52,
    icon: "⛓️",
    house: null,
    type: "Lochy i Podziemia",
    region: "Podziemia Pod Mostem",
    image: "dungeons",
    short_desc: "Mroczne, wilgotne korytarze pod poziomem jeziora, gdzie przetrzymywano czarnoksiężników i bestie.",
    full_lore: `Najstarsza część Cytadeli, wzniesiona jeszcze przed powstaniem murów obronnych. Ściany są tu tak grube, że nie dociera żaden dźwięk z powierzchni.
Lochy wyposażone są w łańcuchy tłumiące magię (Galdra-Fjötrar), uniemożliwiające rzucenie jakiegokolwiek zaklęcia.`,
    npcs: JSON.stringify(["Dozorca Lochów Bård","Uwięziony Upiór Mrozu"]),
    actions: JSON.stringify(["Zbadaj inskrypcje na ścianach cel","Sprawdź właściwości łańcuchów tłumiących magię","Odsłuchaj echa podziemi"]),
    secret_clue: "W celi numer 9 za obluzowaną cegłą ukryto wytrych z kości renifera.",
    quests: JSON.stringify([
      {
            "id": "quest-katakumby-lancuchy",
            "title": "Zagadka Celi Numer Dziewięć",
            "category": "Podziemia & Zręczność",
            "difficulty": "Trudny",
            "discordChannel": "#lochy-katakumby-cienia",
            "reward": {
                  "points": 25,
                  "xp": 95,
                  "galleons": 16,
                  "item": "Wytrych z Kości Renifera"
            },
            "description": "W celi nr 9 za obluzowaną cegłą słychać cichy szelest starych pergaminów. Dozorca Bård odszedł na obchód korytarza.",
            "initialBotMessage": "⛓️ **[CYTADELA BOT - SEKTOR: LOCHY KARY]**\nWilgoć kapie ze sklepienia, a łańcuchy tłumiące magię cicho brzęczą przy kratach.\n*„Masz niecałe dwie minuty zanim dozorca powróci z pochodnią. Działaj szybko i bezszelestnie!”*",
            "suggestedActions": [
                  {
                        "label": "🗝️ Otwórz skrytkę za obluzowaną cegłą",
                        "cmd": "/otworz skrytka-cegla"
                  },
                  {
                        "label": "🤫 Użyj zaklęcia wyciszającego: Muffliato",
                        "cmd": "/rzuc Muffliato"
                  },
                  {
                        "label": "🎲 Test Zwinności i Kradzieży (K20)",
                        "cmd": "/rzut k20 zwinnosc"
                  }
            ],
            "solutionKeywords": [
                  "muffliato",
                  "cegla",
                  "skrytka",
                  "wytrych",
                  "cicho",
                  "alohomora"
            ],
            "successMessage": "🗝️ Wyjmujesz starannie ukryty wytrych z kości renifera i zamykasz cegłę tuż przed powrotem dozorcy. Niezwykły sukces!",
            "failMessage": "⚠️ Hałas upadającego kamienia roznosi się echem po korytarzu! Dozorca zbliża się z pochodnią."
      }
]),
    sort_order: 15
  },
  {
    id: "kancelaria-sowia",
    name: "Kancelaria Kruczej i Sowiej Poczty",
    nordic_name: "Póststofa",
    floor: 2,
    x: 88,
    y: 22,
    icon: "✉️",
    house: null,
    type: "Komunikacja",
    region: "Północno-Wschodnia Strażnica",
    image: "owl-post",
    short_desc: "Gniazdownia kruków posłańczych i sów śnieżnych z widokiem na szczyty fiordów.",
    full_lore: `Wysoka wieża z setkami żerdek dla ptaków posłańczych. W przeciwieństwie do szkół z południa, w Durmstrangu obok sów wykorzystuje się przede wszystkim kruki północne, które nie boją się arktycznych wichur i potrafią latać w zamieciach.`,
    npcs: JSON.stringify(["Mistrz Poczty Roar","Kruki Posłańcze"]),
    actions: JSON.stringify(["Wyślij prywatny list do innego adepta","Odbierz korespondencję z archiwum","Nakarm kruka posłańczego"]),
    secret_clue: "Na najwyższej żerdzi w rogu znajduje się opuszczone gniazdo z zapieczętowanym listem z 1899 roku.",
    quests: JSON.stringify([
      {
            "id": "quest-kancelaria-tajny-list",
            "title": "Zapieczętowany List z 1899 Roku",
            "category": "Sekrety & Historia",
            "difficulty": "Średni",
            "discordChannel": "#kancelaria-krucza-poczta",
            "reward": {
                  "points": 15,
                  "xp": 55,
                  "galleons": 10,
                  "item": "Złota Pieczęć Pocztowa"
            },
            "description": "W opuszczonym gnieździe na najwyższej żerdzi leży zapieczętowany czarnym woskiem list adresowany do ówczesnego dyrektora.",
            "initialBotMessage": "✉️ **[CYTADELA BOT - SEKTOR: KRUCZA POCZTA]**\nKruki posłańcze kraczą cicho, spoglądając na ciebie bystrymi paciorkami oczu.\n*„Żerdź jest oblodzona i wysoka. Wymaga to delikatnego zaklęcia przyciągającego lub zręcznego wejścia.”*",
            "suggestedActions": [
                  {
                        "label": "🪶 Rzuć zaklęcie przyciągające: Accio List",
                        "cmd": "/rzuc Accio List"
                  },
                  {
                        "label": "🦅 Nakarm kruka strażnika smakołykiem",
                        "cmd": "/uzyj orzech-dla-kruka"
                  },
                  {
                        "label": "🎲 Test Precyzji Magicznej (K20)",
                        "cmd": "/rzut k20 precyzja"
                  }
            ],
            "solutionKeywords": [
                  "accio",
                  "kruk",
                  "orzech",
                  "list",
                  "pieczec",
                  "gniazdo"
            ],
            "successMessage": "🪶 List miękko ląduje w twoich rękach. Wosk pęka, odsłaniając fragment intrygi z czasów powstania przymierza szkół magii!",
            "failMessage": "🦅 Kruk strażnik głośno bije skrzydłami, zrzucając odrobinę śniegu na twoją twarz."
      }
]),
    sort_order: 16
  }
];
