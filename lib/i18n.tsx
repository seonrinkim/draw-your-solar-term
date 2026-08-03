"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "ko" | "nl";

export const LANGUAGES: Language[] = ["en", "ko", "nl"];

const STORAGE_KEY = "vhs-language";

interface UiStrings {
  selectHeading: string;
  selectIntro: string;
  seasonSpring: string;
  seasonSummer: string;
  seasonAutumn: string;
  seasonWinter: string;
  wisdomHeading: string;
  drawPromptPrefix: string;
  drawPromptSuffix: string;
  consentText: string;
  backToDrawing: string;
  undo: string;
  clear: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  errorMessage: string;
  aboutLabel: string;
  aboutHeading1: string;
  aboutIntro1: string;
  aboutIntro2: string;
  aboutHeading2: string;
  aboutProjectBody1: string;
  aboutProjectBody2: string;
  aboutSchedule: string;
  aboutCopyright: string;
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    selectHeading: "Choose your solar term",
    selectIntro:
      "Each of the 24 solar terms (절기) carries its own color. Pick the one that speaks to you today.",
    seasonSpring: "Spring 봄",
    seasonSummer: "Summer 여름",
    seasonAutumn: "Autumn 가을",
    seasonWinter: "Winter 겨울",
    wisdomHeading: "Seasonal wisdom",
    drawPromptPrefix: "Draw something that captures the feeling of ",
    drawPromptSuffix:
      " — its color, its mood, its moment in the year. Anything goes, as long as it's a simple line drawing in this term's color.",
    consentText:
      "Your drawing, nickname, and note may be used in Season Diplomats' marketing materials and products. I understand and agree to this use.",
    backToDrawing: "← Back to drawing",
    undo: "Undo",
    clear: "Clear",
    nicknameLabel: "Nickname",
    nicknamePlaceholder: "What should we call you?",
    noteLabel: "Why did you draw this?",
    notePlaceholder: "A short note about your drawing...",
    errorMessage: "Something went wrong while submitting. Please try again.",
    aboutLabel: "About",
    aboutHeading1: "What are the 24 solar terms?",
    aboutIntro1:
      "The 24 solar terms (24절기) are a traditional Korean calendar that divides the year into 24 parts based on the sun's position, reading the shift of the seasons in fine detail. From Ipchun, the beginning of spring, to Daehan, the year's harshest cold, the 24 terms unfold roughly every 15 days.",
    aboutIntro2:
      "They were never just a calendar — they were an old way of watching nature and living in step with it: timing the work of farming, sharing foods and customs that cared for the body through each stretch of the year, and noticing every turn of the season before it passed.",
    aboutHeading2: "About our project",
    aboutProjectBody1:
      "Van het Seizoen is a non-commercial exhibition organized by four Korean students living in the Netherlands. It sets Korea's 24 solar terms beside the Dutch seasons, showing through photographs and climate data how the boundaries between seasons are shifting in both countries. Korean seasonal wisdom — ondol floor heating, fermentation, eating with the season — is reintroduced as everyday climate practice, and visitors finish the exhibition by making their own seasonal record.",
    aboutProjectBody2:
      "This project has been selected as part of the Ministry of Foreign Affairs of the Republic of Korea's 2026 People-led Public Diplomacy programme.",
    aboutSchedule:
      "22 September – 4 October 2026 | 09:00 – 22:00 | Amsterdam House of Arts & Crafts (Oudeschans 21, 1011 KS Amsterdam)",
    aboutCopyright: "Copyright 2026 Season Diplomats. All rights reserved.",
  },
  ko: {
    selectHeading: "절기를 선택하세요",
    selectIntro:
      "24절기는 저마다 고유한 색을 지니고 있어요. 오늘의 마음에 와닿는 절기를 골라보세요.",
    seasonSpring: "봄",
    seasonSummer: "여름",
    seasonAutumn: "가을",
    seasonWinter: "겨울",
    wisdomHeading: "절기 속 지혜",
    drawPromptPrefix: "",
    drawPromptSuffix:
      "의 색깔과 분위기, 그 계절의 순간을 담아 그려보세요. 이 절기의 색을 사용한 단순한 선 그림이라면 무엇이든 좋습니다.",
    consentText:
      "그림, 닉네임, 작성한 글은 Season Diplomats의 홍보 자료 및 제작물에 활용될 수 있습니다. 이에 동의합니다.",
    backToDrawing: "← 그림으로 돌아가기",
    undo: "실행 취소",
    clear: "전체 지우기",
    nicknameLabel: "닉네임",
    nicknamePlaceholder: "어떻게 불러드릴까요?",
    noteLabel: "왜 이 그림을 그렸나요?",
    notePlaceholder: "그림에 대한 짧은 이야기를 남겨주세요...",
    errorMessage: "제출 중 문제가 발생했어요. 다시 시도해 주세요.",
    aboutLabel: "About",
    aboutHeading1: "24절기란 무엇일까요?",
    aboutIntro1:
      "24절기는 태양의 위치에 따라 1년을 24등분하여 계절의 변화를 세밀하게 읽어내는 한국의 전통 절기력입니다. 봄이 시작되는 입춘(立春)부터 한 해의 가장 큰 추위인 대한(大寒)까지, 약 15일 간격으로 이어지는 24개의 절기는 단순한 달력이 아니라 자연의 변화를 관찰하고 그에 맞춰 살아가기 위한 오래된 지혜였습니다.",
    aboutIntro2:
      "절기마다 농사의 때를 가늠하고, 몸을 돌보는 음식과 풍습을 나누며, 계절이 바뀌는 순간들을 놓치지 않고 기록해온 방식이었죠.",
    aboutHeading2: "우리의 프로젝트를 소개합니다",
    aboutProjectBody1:
      "Van het Seizoen은 네덜란드에 거주하는 네 명의 한국인 유학생이 기획한 비영리 전시로, 한국의 24절기와 네덜란드의 사계절을 나란히 놓고 기후변화로 흔들리는 계절의 경계를 사진과 기후 데이터로 보여줍니다. 온돌, 발효, 제철 음식 등 절기 속에 담긴 한국의 지혜를 오늘의 기후 실천으로 소개하며, 관람객이 직접 참여해 자신만의 계절 기록을 남기는 것으로 마무리됩니다.",
    aboutProjectBody2:
      "이 프로젝트는 대한민국 외교부의 2026 국민공공외교 사업으로 선정되어 진행됩니다.",
    aboutSchedule:
      "2026년 9월 22일 – 10월 4일 | 09:00 – 22:00 | Amsterdam House of Arts & Crafts (Oudeschans 21, 1011 KS Amsterdam)",
    aboutCopyright: "Copyright 2026 Season Diplomats. All rights reserved.",
  },
  nl: {
    selectHeading: "Kies je zonneterm",
    selectIntro:
      "Elk van de 24 zonnetermen (절기) heeft zijn eigen kleur. Kies degene die je vandaag aanspreekt.",
    seasonSpring: "Lente 봄",
    seasonSummer: "Zomer 여름",
    seasonAutumn: "Herfst 가을",
    seasonWinter: "Winter 겨울",
    wisdomHeading: "Wijsheid van het seizoen",
    drawPromptPrefix: "Teken iets dat het gevoel vangt van ",
    drawPromptSuffix:
      " — de kleur, de sfeer, dit moment in het jaar. Alles mag, zolang het een eenvoudige lijntekening is in de kleur van deze term.",
    consentText:
      "Je tekening, bijnaam en notitie kunnen worden gebruikt in marketingmateriaal en producten van Season Diplomats. Ik begrijp dit en ga hiermee akkoord.",
    backToDrawing: "← Terug naar tekenen",
    undo: "Ongedaan maken",
    clear: "Wissen",
    nicknameLabel: "Bijnaam",
    nicknamePlaceholder: "Hoe mogen we je noemen?",
    noteLabel: "Waarom heb je dit getekend?",
    notePlaceholder: "Een korte notitie over je tekening...",
    errorMessage: "Er ging iets mis bij het versturen. Probeer het opnieuw.",
    aboutLabel: "About",
    aboutHeading1: "Wat zijn de 24 zonnetermen?",
    aboutIntro1:
      "De 24 zonnetermen (24절기) vormen een traditionele Koreaanse kalender die het jaar op basis van de zonnestand in 24 delen verdeelt, om de verschuivingen van de seizoenen tot in detail te volgen. Van Ipchun, het begin van de lente, tot Daehan, de strengste kou van het jaar, volgen de 24 termen elkaar op met ongeveer 15 dagen ertussen.",
    aboutIntro2:
      "Het was nooit slechts een kalender — het was een eeuwenoude manier om de natuur te observeren en daarmee in de pas te leven: het bepalen van het juiste moment voor landbouw, het delen van voeding en gewoonten die het lichaam door elke fase van het jaar hielpen, en het niet voorbij laten gaan van een seizoenswisseling zonder die op te merken.",
    aboutHeading2: "Over ons project",
    aboutProjectBody1:
      "Van het Seizoen is een non-commerciële tentoonstelling, georganiseerd door vier Koreaanse studenten die in Nederland wonen. De tentoonstelling zet de 24 Koreaanse zonnetermen naast de Nederlandse seizoenen en laat met foto's en klimaatdata zien hoe de grenzen tussen de seizoenen in beide landen verschuiven. Koreaanse seizoenswijsheid — zoals ondol-vloerverwarming, fermentatie en eten met het seizoen — wordt opnieuw geïntroduceerd als alledaagse klimaatpraktijk, en bezoekers sluiten de tentoonstelling af door hun eigen seizoensregister te maken.",
    aboutProjectBody2:
      "Dit project is geselecteerd als onderdeel van het 2026 People-led Public Diplomacy-programma van het Ministerie van Buitenlandse Zaken van de Republiek Korea.",
    aboutSchedule:
      "22 september – 4 oktober 2026 | 09:00 – 22:00 | Amsterdam House of Arts & Crafts (Oudeschans 21, 1011 KS Amsterdam)",
    aboutCopyright: "Copyright 2026 Season Diplomats. All rights reserved.",
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: UiStrings;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Read the persisted language after mount only, so the client's first
    // render matches the server-rendered ("en") output and avoids a
    // hydration mismatch.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && LANGUAGES.includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: UI_STRINGS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
