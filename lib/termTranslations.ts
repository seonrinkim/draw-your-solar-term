import { SolarTerm } from "@/lib/terms";
import { Language } from "@/lib/i18n";

interface TermTranslation {
  english: string;
  description: string;
  wisdom: string;
}

type TranslationMap = Record<string, TermTranslation>;

export const TERM_TRANSLATIONS: Record<"ko" | "nl", TranslationMap> = {
  ko: {
    ipchun: {
      english: "봄의 시작",
      description: "아직 차가운 땅 속에서 온기가 처음으로 꿈틀거리는 시기.",
      wisdom:
        "예로부터 집집마다 대문과 문설주에 '입춘첩'이라는 손글씨 글귀를 붙여, 한 해의 복과 풍요를 기원했습니다.",
    },
    usu: {
      english: "빗물",
      description: "눈이 녹아 비가 되고, 땅이 서서히 부드러워지는 시기.",
      wisdom:
        "강의 얼음이 풀리고 눈이 비로 바뀌면, 농부들은 못자리를 준비하고 농기구를 손질하기 시작했습니다. 우수는 파종을 준비하라는 자연의 신호로 여겨졌습니다.",
    },
    gyeongchip: {
      english: "겨울잠 자던 벌레들이 깨어남",
      description: "겨울잠 자던 생명들이 첫 천둥소리에 깨어나는 시기.",
      wisdom:
        "이날 길어 올린 샘물에는 특별한 생기가 깃든다고 믿었으며, 경칩에 달걀을 먹는 것은 땅이 깨어나는 시기에 건강을 비는 작은 의식으로 여겨졌습니다.",
    },
    chunbun: {
      english: "낮과 밤의 길이가 같아지는 날",
      description: "낮과 밤의 길이가 같아지고, 싱그러운 초록이 대지를 물들이는 시기.",
      wisdom:
        "낮과 밤의 길이가 같아지는 춘분은 농사의 진정한 시작을 알리는 날로, 본격적인 밭갈이가 시작되었고 어른들은 그날의 바람과 날씨를 살펴 그해 수확의 길흉을 점쳤습니다.",
    },
    cheongmyeong: {
      english: "맑고 밝음",
      description: "하늘이 맑아지고 들판이 밝아져, 본격적인 농사가 시작되는 시기.",
      wisdom:
        "한식 명절과 가까운 이 시기에는 전통적으로 조상의 묘를 찾아 돌보았고, 옛 풍습에 따라 아궁이 불을 지피지 않고 전날 미리 마련해둔 음식만 먹는 집안도 있었습니다.",
    },
    gogu: {
      english: "곡식을 적시는 비",
      description: "부드러운 비가 갓 뿌린 곡식을 촉촉이 적셔주는 시기.",
      wisdom:
        "이 시기는 고로쇠나무의 수액을 받기에 가장 좋은 때로 여겨져 봄철 보약으로 마셨으며, 벼농사를 짓는 이들은 비가 땅에 스며드는 동안 논에 물모를 심기 시작했습니다.",
    },
    ipha: {
      english: "여름의 시작",
      description: "잎이 무성해지고 공기가 따뜻하고 습해지는 시기.",
      wisdom:
        "마을은 본격적인 여름 리듬으로 접어들어 모내기를 하고, 많은 가정에서 명주실을 얻기 위해 기르던 누에에게 먹일 뽕잎을 돌보았습니다.",
    },
    soman: {
      english: "곡식이 여물어감",
      description: "초여름의 강해지는 햇살 아래 작물이 여물어가는 시기.",
      wisdom:
        "밭의 보리가 여물기 시작하면 집집마다 물대기와 김매기로 분주해지며, 곧 다가올 망종의 수확 성수기를 준비했습니다.",
    },
    mangjong: {
      english: "이삭이 패는 시기",
      description: "보리가 익고 논에는 볍모가 심어지는 시기.",
      wisdom:
        "보리 수확과 모내기가 한꺼번에 겹쳐, \"가만히 서 있어도 발이 젖는다\"는 말이 생겨날 만큼 눈코 뜰 새 없이 바빴습니다. 망종은 한 해 농사 중 가장 고된 시기로 기억됩니다.",
    },
    haji: {
      english: "낮이 가장 긴 날",
      description: "일 년 중 낮이 가장 길고, 하늘이 가장 눈부신 날.",
      wisdom:
        "하지 무렵이면 보리 수확이 끝날 것으로 여겨졌으며, 하늘이 너무 오래 맑으면 마을에서는 기우제를 지내 논에 물을 대어 여름을 날 수 있기를 기원했습니다.",
    },
    soseo: {
      english: "작은 더위",
      description: "장마가 절정에 달하며 후텁지근한 더위가 자리 잡는 시기.",
      wisdom:
        "한국의 장마철이 시작되면 집집마다 지붕과 배수로를 보강해 침수에 대비했고, 짙어지는 습기를 이겨내기 위해 몸을 식혀주는 소화가 잘되는 음식으로 식단을 바꾸었습니다.",
    },
    daeseo: {
      english: "큰 더위",
      description: "일 년 중 가장 더운 날들, 짙은 여름 아지랑이가 감도는 시기.",
      wisdom:
        "삼복 더위에 속하는 이 시기, 사람들은 \"이열치열\"을 믿으며 뜨거운 삼계탕을 먹었고, 살갗에 바람이 잘 통하도록 헐렁한 삼베옷을 입었습니다.",
    },
    ipchu: {
      english: "가을의 시작",
      description: "가시지 않은 더위 속으로 서늘한 기운이 처음 스며드는 시기.",
      wisdom:
        "농부들은 입추의 날씨를 유심히 살폈는데, 그날의 바람과 하늘이 다가올 벼농사의 풍흉을 미리 알려준다는 옛말이 있었기 때문입니다.",
    },
    cheoseo: {
      english: "더위가 그침",
      description: "여름 더위가 한풀 꺾이고 아침 공기가 선선해지는 시기.",
      wisdom:
        "\"처서에는 모기 입도 삐뚤어진다\"는 유명한 속담이 있을 만큼, 선선해진 공기를 신호 삼아 집집마다 이불과 여름옷을 볕에 내다 말린 뒤 정리해 넣었습니다.",
    },
    baengno: {
      english: "하얀 이슬",
      description: "서늘한 밤이 지나가며 풀잎 위에 하얀 이슬이 맺히는 시기.",
      wisdom:
        "차가운 아침 이슬이 들판에 내려앉기 시작하면, 사람들은 벼 수확과 함께 뒤따라오는 가을 명절 추석을 준비하기 시작했습니다.",
    },
    chubun: {
      english: "낮과 밤의 길이가 같아지는 날",
      description: "낮과 밤이 다시 같아지고, 나뭇잎이 물들어가는 시기.",
      wisdom:
        "낮과 밤이 다시 같아지는 이 시기는 감사의 계절로, 조상의 산소를 돌보고 한 해의 수확을 나누며 추석에 깃든 감사의 마음과 같은 정신을 이어갔습니다.",
    },
    hallo: {
      english: "차가운 이슬",
      description: "이슬이 차가워지며 가을이 겨울을 향해 깊어가는 시기.",
      wisdom:
        "국화가 만개하면 사람들은 전통적으로 국화주를 마시고, 추위가 완전히 자리 잡기 전 단풍을 감상하러 산으로 가을 나들이를 떠났습니다.",
    },
    sanggang: {
      english: "서리가 내림",
      description: "한 해의 첫 서리가 시들어가는 들판 위에 내려앉는 시기.",
      wisdom:
        "한 해의 첫 서리가 다가오면 농부들은 서둘러 마지막 벼 수확을 마쳤고, 고추와 감은 추위가 닥치기 전 가을 햇볕에 널어 말렸습니다.",
    },
    ipdong: {
      english: "겨울의 시작",
      description: "공기가 차가워지고 대지가 쉼을 준비하는 시기.",
      wisdom:
        "전통적으로 이 무렵부터 김장이 시작되어, 온 가족과 이웃이 모여 긴 겨울을 날 만큼 충분한 김치를 함께 담갔습니다.",
    },
    soseol: {
      english: "작은 눈",
      description: "첫눈이 가볍게 흩날리며 어두워지는 계절을 물들이는 시기.",
      wisdom:
        "첫눈과 매서워진 바람이 찾아오면, 집집마다 문풍지로 창과 문의 틈새를 막는 일을 마무리하고 두꺼운 겨울옷을 꺼내 다가올 추위에 대비했습니다.",
    },
    daeseol: {
      english: "큰 눈",
      description: "함박눈이 고요한 겨울 풍경을 뒤덮는 시기.",
      wisdom:
        "대설의 폭설은 두려움의 대상이 아니라 반가운 소식이었습니다. 두텁게 쌓인 눈이 보리밭을 덮어 이듬해 더 풍성한 수확을 약속한다고 믿었기 때문입니다.",
    },
    dongji: {
      english: "밤이 가장 긴 날",
      description: "일 년 중 밤이 가장 길고 고요한 날.",
      wisdom:
        "한 해 중 밤이 가장 긴 이날, 가족들은 액운을 쫓는다는 팥죽을 먹었으며, 저마다 자기 나이만큼 새알심을 넣어 먹었습니다.",
    },
    sohan: {
      english: "작은 추위",
      description: "일 년 중 가장 추운 시기가 매섭게 다가오는 때.",
      wisdom:
        "이름과 달리 소한은 뒤따르는 대한보다 더 추운 경우가 많아, \"대한이 소한 집에 놀러 갔다가 얼어 죽었다\"는 옛말이 있을 정도입니다. 집집마다 이 시기에 식량과 땔감을 넉넉히 마련해두었습니다.",
    },
    daehan: {
      english: "큰 추위",
      description: "봄이 돌아오기 직전, 한 해 중 가장 혹독한 추위.",
      wisdom:
        "한 해의 마지막 절기인 대한에는 전통적으로 연말 집안일과 묵은해를 보내는 의례를 마무리하여, 깨끗한 마음으로 입춘과 새로운 봄의 순환을 맞이할 준비를 했습니다.",
    },
  },
  nl: {
    ipchun: {
      english: "Begin van de lente",
      description: "De eerste roering van warmte onder nog koude aarde.",
      wisdom:
        "Vroeger plakten families met de hand geschreven spreuken, ipchuncheop (입춘첩) genoemd, op hun poorten en deurposten, in de hoop op geluk en overvloed voor het komende jaar.",
    },
    usu: {
      english: "Regenwater",
      description: "Sneeuw smelt tot regen terwijl de aarde langzaam zachter wordt.",
      wisdom:
        "Terwijl het rivierijs brak en sneeuw in regen veranderde, begonnen boeren zaaibedden klaar te maken en gereedschap te herstellen — Usu gold als de aankondiging van de natuur om je voor te bereiden op het planten.",
    },
    gyeongchip: {
      english: "Ontwaken van de insecten",
      description: "Slapende dieren ontwaken bij de eerste donder van het seizoen.",
      wisdom:
        "Men geloofde dat bronwater dat op deze dag werd geschept bijzondere levenskracht bezat, en het eten van eieren op Gyeongchip gold als een klein ritueel voor goede gezondheid nu de aarde ontwaakte.",
    },
    chunbun: {
      english: "Lente-equinox",
      description: "Dag en nacht in balans, terwijl fris groen zich over het land verspreidt.",
      wisdom:
        "Met dag en nacht in evenwicht markeerde Chunbun het echte begin van het landbouwjaar — het grootschalig ploegen begon, en ouderen lazen de wind en het weer van die dag als een voorteken voor de oogst van het seizoen.",
    },
    cheongmyeong: {
      english: "Helder en licht",
      description: "De lucht klaart op en de velden lichten op voor het planten van het seizoen.",
      wisdom:
        "Vallend rond de feestdag Hansik (한식), was dit van oudsher een dag om voorouderlijke graven te bezoeken en te verzorgen; sommige huishoudens aten volgens oud gebruik alleen eten dat de dag ervoor was bereid, terwijl de haard onaangestoken bleef.",
    },
    gogu: {
      english: "Regen voor het graan",
      description: "Zachte regens voeden het pas gezaaide graan.",
      wisdom:
        "Dit gold als de beste tijd om sap te tappen uit gorosoe (고로쇠) bomen, gedronken als lentetonicum, terwijl rijstboeren begonnen met natzaaien in de rijstvelden terwijl de regen in de grond trok.",
    },
    ipha: {
      english: "Begin van de zomer",
      description: "Bladeren worden dikker terwijl de lucht warm en vochtig wordt.",
      wisdom:
        "Dorpen schakelden over naar het volle zomerritme: rijstplantjes werden overgeplant en moerbeibladeren verzorgd om de zijderupsen te voeden die veel gezinnen hielden voor zijde.",
    },
    soman: {
      english: "Graan wordt vol",
      description: "Gewassen vullen zich onder de sterker wordende vroege zomerzon.",
      wisdom:
        "Terwijl de gerst op de velden begon te rijpen, hielden huishoudens zich bezig met irrigeren en wieden, in voorbereiding op de oogstdrukte die Mangjong (망종) weldra zou brengen.",
    },
    mangjong: {
      english: "Aar in de halm",
      description: "Gerst rijpt en rijstplantjes worden in de velden geplant.",
      wisdom:
        "Gerstoogst en het overplanten van rijst vielen samen, wat aanleiding gaf tot het gezegde dat mensen zo druk waren dat ze \"hun eigen voeten nat maakten terwijl ze stilstonden\" — Mangjong staat bekend als de zwaarste werkperiode van het landbouwjaar.",
    },
    haji: {
      english: "Zomerzonnewende",
      description: "De langste dag van het jaar, onder de helderste hemel.",
      wisdom:
        "Met de gerstoogst die naar verwachting rond Haji klaar zou zijn, hielden gemeenschappen regenrituelen als de lucht te lang droog bleef, biddend om genoeg water om de rijstvelden de zomer door te helpen.",
    },
    soseo: {
      english: "Kleine hitte",
      description: "Vochtige hitte zet zich in terwijl het regenseizoen zijn hoogtepunt bereikt.",
      wisdom:
        "Terwijl het Koreaanse regenseizoen, jangma (장마), inzette, versterkten huishoudens daken en afwatering tegen overstromingen en schakelden ze over op verkoelende, licht verteerbare maaltijden om de toenemende vochtigheid het hoofd te bieden.",
    },
    daeseo: {
      english: "Grote hitte",
      description: "De heetste dagen van het jaar, dik van de zomerse waas.",
      wisdom:
        "Vallend binnen de hondsdagen van sambok (삼복), aten mensen in deze tijd hete samgyetang (삼계탕), gelovend in \"hitte met hitte bestrijden,\" en droegen ze losse kleding van sambe (삼베), hennep die lucht langs de huid liet stromen.",
    },
    ipchu: {
      english: "Begin van de herfst",
      description: "Een eerste vleugje koelte glipt door de aanhoudende hitte.",
      wisdom:
        "Boeren hielden het weer op Ipchu nauwlettend in de gaten, want een oud gezegde wilde dat de wind en de lucht van die dag voorspelden hoe overvloedig de komende rijstoogst zou zijn.",
    },
    cheoseo: {
      english: "Einde van de hitte",
      description: "De zomerhitte breekt en de ochtenden worden fris.",
      wisdom:
        "Een bekend gezegde luidt dat \"zelfs de mond van een mug scheeftrekt\" tegen Cheoseo — huishoudens namen de afkoelende lucht als teken om beddengoed en zomerkleren te luchten en in de zon te drogen voordat ze werden opgeborgen.",
    },
    baengno: {
      english: "Witte dauw",
      description: "Koele nachten laten dauw glinsteren, wit op het gras.",
      wisdom:
        "Nu er koele ochtenddauw op de velden neerdaalt, begonnen gezinnen zich voor te bereiden op de rijstoogst en op Chuseok (추석), het herfstoogstfeest dat vaak vlak daarna valt.",
    },
    chubun: {
      english: "Herfstequinox",
      description: "Dag en nacht komen weer in balans terwijl de bladeren kleuren.",
      wisdom:
        "Nu dag en nacht opnieuw in balans waren, was dit een seizoen van dankbaarheid — het onderhouden van familiegraven en het delen van de oogst van het jaar, in dezelfde geest van dankbaarheid die de kern vormt van Chuseok (추석).",
    },
    hallo: {
      english: "Koude dauw",
      description: "Dauw wordt koud terwijl de herfst zich verdiept richting de winter.",
      wisdom:
        "Terwijl chrysanten in bloei kwamen, dronken mensen van oudsher gukhwaju (국화주), wijn getrokken op chrysanten, en maakten ze herfstuitstapjes de heuvels in om van het verkleurende blad te genieten voordat de kou volledig inzette.",
    },
    sanggang: {
      english: "Vallende vorst",
      description: "De eerste vorst van het jaar daalt neer over vervagende velden.",
      wisdom:
        "Met de eerste vorst van het jaar op komst, haastten boeren zich om de laatste rijstoogst binnen te halen, terwijl rode pepers en kaki's in de herfstzon werden uitgespreid om te drogen voordat de kou ze kon bereiken.",
    },
    ipdong: {
      english: "Begin van de winter",
      description: "De lucht wordt scherper terwijl het land zich voorbereidt op rust.",
      wisdom:
        "Traditioneel begon rond deze tijd kimjang (김장) — hele families en buren kwamen samen om genoeg kimchi te maken om het huishouden door de lange komende winter te helpen.",
    },
    soseol: {
      english: "Kleine sneeuw",
      description: "De eerste lichte sneeuw bestrooit het donker wordende seizoen.",
      wisdom:
        "Met de eerste sneeuw en scherpere wind voltooiden huishoudens het afdichten van ramen en deuren tegen tocht en haalden ze zwaardere winterkleding tevoorschijn ter voorbereiding op de komende kou.",
    },
    daeseol: {
      english: "Grote sneeuw",
      description: "Zware sneeuw bedekt het stille winterlandschap.",
      wisdom:
        "Zware sneeuwval met Daeseol werd verwelkomd in plaats van gevreesd — een dikke sneeuwlaag zou de tarwevelden isoleren en een rijkere oogst in het volgende jaar beloven.",
    },
    dongji: {
      english: "Winterzonnewende",
      description: "De langste nacht van het jaar, diep en stil.",
      wisdom:
        "Op de langste nacht van het jaar aten families patjuk (팥죽), rodebonenpap met kleverige rijstballetjes, waarvan gezegd werd dat het kwade geesten afweerde — en iedereen voegde één rijstballetje toe voor elk levensjaar.",
    },
    sohan: {
      english: "Kleine kou",
      description: "De koudste periode van het jaar begint te bijten.",
      wisdom:
        "Ondanks zijn naam is Sohan vaak kouder dan de Daehan (대한) die erop volgt — een oud gezegde grapt dat \"Daehan doodvroor tijdens een bezoek aan het huis van Sohan,\" en huishoudens gebruikten deze periode om voedsel en brandhout in te slaan.",
    },
    daehan: {
      english: "Grote kou",
      description: "De strengste kou van het jaar, vlak voordat de lente terugkeert.",
      wisdom:
        "Als de laatste zonneterm van het jaar werd Daehan van oudsher besteed aan het afronden van jaareindeklusjes en rituelen om het oude jaar uit te luiden, zodat het huishouden Ipchun (입춘) en de nieuwe cyclus van de lente met een schone lei kon begroeten.",
    },
  },
};

export function localizeTerm(term: SolarTerm, language: Language): SolarTerm {
  if (language === "en") return term;
  const translation = TERM_TRANSLATIONS[language][term.slug];
  if (!translation) return term;
  return { ...term, ...translation };
}
