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
