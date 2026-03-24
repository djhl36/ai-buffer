import Link from "next/link";

function Card({
  emoji,
  title,
  desc,
  examples,
  href,
  cta,
}: {
  emoji: string;
  title: string;
  desc: string;
  examples: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="text-4xl sm:text-5xl">{emoji}</div>
      <h2 className="mt-3 text-lg font-bold sm:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{desc}</p>

      <div className="mt-4 rounded-2xl bg-gray-50 p-3 sm:p-4">
        <div className="text-[11px] font-semibold text-gray-500 sm:text-xs">
          이런 때 사용해보세요
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-800">
          {examples.map((v) => (
            <li key={v}>• {v}</li>
          ))}
        </ul>
      </div>

      <Link
        href={href}
        className="mt-5 rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white"
      >
        {cta}
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6 sm:py-12 lg:py-14">
        <div className="mx-auto inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] text-gray-600 sm:text-xs">
          감정 메시지 정리 / 상황 메시지 생성 AI
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          하고 싶은 말을 하게 해주는 AI
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
          화가 났는데 말을 못 하셨나요?
          <br className="hidden sm:block" />
          거절해야 하는데 어떻게 말할지 모르셨나요?
        </p>

        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          감정/상황을 고르고, 누구에게 보내는지와 내용을 입력하면
          AI가 바로 보낼 수 있는 문장으로 정리해줍니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card
            emoji="🔥 😡 😤"
            title="감정 정리하기"
            desc="날것 그대로 쓴 말을, 의도는 살리고 표현만 정리해드립니다."
            examples={[
              "왜 맨날 나만 하냐고 말하고 싶을 때",
              "화난 상태에서 카톡 보내기 전에",
              "답답한 마음을 그대로 보내기 전에",
            ]}
            href="/emotion"
            cta="감정 메시지 정리하기"
          />

          <Card
            emoji="😓 🤝"
            title="상황 메시지 만들기"
            desc="무슨 말을 해야 할지 모르겠을 때, 상황에 맞는 자연스러운 초안을 만들어드립니다."
            examples={[
              "거절 메시지를 보내야 할 때",
              "상사에게 불만을 전달해야 할 때",
              "거래처와 조심스럽게 이야기해야 할 때",
            ]}
            href="/situation"
            cta="상황 메시지 만들기"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/history"
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            내 기록 보기
          </Link>
          <Link
            href="/admin?key=change-this"
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            admin
          </Link>
        </div>

        <p className="mt-6 text-[11px] leading-5 text-gray-400 sm:text-xs">
          사용자가 입력한 내용은 저장되지 않으며, 성능 개선을 위해 피드백 결과를 수집합니다.
        </p>
      </section>
    </main>
  );
}