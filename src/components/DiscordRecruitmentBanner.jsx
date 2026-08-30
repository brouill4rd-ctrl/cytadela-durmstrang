import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const DiscordIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52c-.21.38-.46.9-.63 1.3a18.27 18.27 0 0 0-5.42 0c-.18-.4-.43-.92-.64-1.3-1.71.29-3.34.81-4.89 1.52C.76 9.06-.07 13.64.36 18.15a19.9 19.9 0 0 0 6 3.03c.48-.66.91-1.36 1.28-2.1-.7-.27-1.38-.6-2.02-.97.17-.13.33-.26.49-.39 3.9 1.8 8.13 1.8 11.98 0 .16.13.32.27.49.39-.65.38-1.33.7-2.03.98.37.73.8 1.43 1.28 2.09a19.84 19.84 0 0 0 6-3.03c.5-5.23-.85-9.77-3.53-13.78ZM8.02 15.37c-1.17 0-2.14-1.08-2.14-2.41s.95-2.42 2.14-2.42c1.2 0 2.16 1.09 2.14 2.42 0 1.33-.95 2.41-2.14 2.41Zm7.96 0c-1.17 0-2.14-1.08-2.14-2.41s.95-2.42 2.14-2.42c1.2 0 2.16 1.09 2.14 2.42 0 1.33-.94 2.41-2.14 2.41Z" />
  </svg>
);

export const DiscordRecruitmentBanner = () => (
  <section className="discord-recruitment" aria-labelledby="discord-recruitment-title">
    <div className="discord-recruitment__frame" aria-hidden="true" />
    <div className="discord-recruitment__runes" aria-hidden="true">
      ᚦ ᛉ ᚱ ᛞ · ᚨ ᚾ ᛋ ᚢ ᛉ · ᚲ ᚾ ᛟ ᚹ ᛚ ᛖ ᛞ ᚷ ᛖ
    </div>

    <div className="discord-recruitment__content">
      <div className="discord-recruitment__copy">
        <h2 id="discord-recruitment-title">
          Dołącz do nas <span>na Discordzie</span>
        </h2>

        <p className="discord-recruitment__lead">
          Poznaj adeptów, profesorów i członków czterech Zakonów.
        </p>
      </div>

      <div className="discord-recruitment__footer">
        <a
          className="discord-recruitment__cta"
          href="/api/discord/invite"
          target="_blank"
          rel="noreferrer"
          aria-label="Dołącz teraz do Twierdzy Magii Durmstrang na Discordzie (otwiera nową kartę)"
        >
          <DiscordIcon size={20} />
          <span>
            <strong>Dołącz teraz</strong>
            <small>Twierdza czeka</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>

      </div>
    </div>

  </section>
);
