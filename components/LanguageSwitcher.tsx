"use client";

import { useEffect, useState } from "react";
import { translations, Language } from "@/lib/translations";

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const idiomaGuardado =
      localStorage.getItem("language");

    if (
      idiomaGuardado === "en" ||
      idiomaGuardado === "pt"
    ) {
      setLanguage(idiomaGuardado);
    }
  }, []);

  function mudarIdioma(novoIdioma: Language) {
    setLanguage(novoIdioma);

    localStorage.setItem(
      "language",
      novoIdioma
    );

    window.dispatchEvent(
      new Event("languageChanged")
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">

      <button
        type="button"
        onClick={() => mudarIdioma("en")}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
          language === "en"
            ? "bg-white text-black shadow-sm"
            : "text-gray-400 hover:text-black"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => mudarIdioma("pt")}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
          language === "pt"
            ? "bg-white text-black shadow-sm"
            : "text-gray-400 hover:text-black"
        }`}
      >
        PT
      </button>

    </div>
  );
}