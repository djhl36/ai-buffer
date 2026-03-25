export const metadata = {
  title: "이용약관 | AI Buffer",
  description: "AI Buffer 이용약관",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-7 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-black dark:text-white">이용약관</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        본 약관은 AI Buffer(이하 "서비스")의 이용 조건과 운영 원칙을 정합니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. 서비스 내용</h2>
        <p>
          서비스는 이용자가 입력한 감정 표현, 상황 설명, 메시지 초안을 바탕으로
          정리된 메시지 또는 상황에 맞는 메시지 초안을 생성하는 AI 기반 도구입니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. 이용자의 책임</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>이용자는 본인이 입력한 내용에 대한 책임을 집니다.</li>
          <li>불법, 타인 권리 침해, 혐오·폭력 조장, 사기 목적의 이용을 금지합니다.</li>
          <li>AI가 생성한 결과는 참고용이며, 실제 전송 전 최종 판단 책임은 이용자에게 있습니다.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. 서비스의 한계</h2>
        <p>
          서비스는 자동 생성된 결과를 제공하며, 모든 상황에서 완전한 정확성이나 적합성을 보장하지 않습니다.
          민감한 법률, 의료, 금융, 고위험 의사결정에는 전문가 판단을 우선해야 합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. 유료 서비스</h2>
        <p>
          서비스는 일부 기능을 유료로 제공할 수 있습니다. 유료 상품의 종류, 가격, 사용량 제한,
          구독 여부, 갱신 조건은 결제 화면 또는 별도 안내 페이지에 표시됩니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. 구독 및 해지</h2>
        <p>
          정기결제 상품이 있는 경우, 이용자는 결제 화면 또는 계정 설정에서 구독 해지 절차를 진행할 수 있습니다.
          해지 시 이미 결제된 이용 기간 동안의 사용 권한은 별도 고지가 없는 한 남은 기간까지 유지됩니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. 환불</h2>
        <p>
          환불 기준은 별도의 환불정책 페이지에 따릅니다. 다만 법령상 청약철회 또는 환불이 필요한 경우,
          관련 법령을 우선 적용합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">7. 서비스 변경 및 중단</h2>
        <p>
          서비스는 운영상 필요에 따라 기능, 가격, 제공 방식이 변경될 수 있으며,
          중대한 변경은 사전에 합리적인 방법으로 안내합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">8. 책임 제한</h2>
        <p>
          서비스는 AI 결과물 사용에 따른 직접적·간접적 손해에 대해 법령상 허용되는 범위 내에서 책임을 제한할 수 있습니다.
          단, 서비스의 고의 또는 중대한 과실이 있는 경우는 제외합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">9. 문의처</h2>
        <p>이메일: rrt784512@snu.ac.kr</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">10. 시행일</h2>
        <p>본 약관은 2026년 3월 25일부터 적용됩니다.</p>
      </section>
    </main>
  );
}