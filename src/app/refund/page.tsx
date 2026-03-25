export const metadata = {
  title: "환불정책 | AI Buffer",
  description: "AI Buffer 환불정책",
};

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-7 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-black dark:text-white">환불정책</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        AI Buffer는 디지털 서비스의 특성을 고려하여 아래와 같은 환불 기준을 운영합니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. 단건 결제 상품</h2>
        <p>
          결제 후 서비스 이용 또는 크레딧 사용이 전혀 이루어지지 않은 경우,
          결제일로부터 7일 이내에 환불을 요청할 수 있습니다.
        </p>
        <p>
          이미 일부 또는 전부 사용된 경우에는 사용량에 따라 전액 환불이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. 정기결제 상품</h2>
        <p>
          정기결제는 다음 결제일부터 해지되며, 이미 결제된 기간에 대해서는 원칙적으로 일할 환불하지 않습니다.
        </p>
        <p>
          다만, 중복 결제, 시스템 오류, 명백한 서비스 장애 등 서비스 책임 사유가 있는 경우에는 예외적으로 환불할 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. 환불이 제한되는 경우</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>디지털 서비스가 이미 제공된 경우</li>
          <li>이용자의 책임 있는 사유로 환불 필요성이 발생한 경우</li>
          <li>약관 위반 또는 비정상 사용이 확인된 경우</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. 환불 요청 방법</h2>
        <p>
          아래 이메일로 주문 정보와 함께 환불을 요청해 주세요.
        </p>
        <p>이메일: rrt784512@snu.ac.kr</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. 처리 기간</h2>
        <p>
          환불 승인 시 결제수단 및 결제대행사 사정에 따라 영업일 기준 수일이 소요될 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. 시행일</h2>
        <p>본 정책은 2026년 3월 25일부터 적용됩니다.</p>
      </section>
    </main>
  );
}