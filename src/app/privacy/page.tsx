export const metadata = {
  title: "개인정보처리방침 | AI Buffer",
  description: "AI Buffer 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-7 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-black dark:text-white">개인정보처리방침</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        AI Buffer(이하 "서비스")는 이용자의 개인정보를 소중하게 생각하며, 관련 법령을 준수하기 위해
        아래와 같이 개인정보처리방침을 안내합니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. 수집하는 정보</h2>
        <p>
          서비스는 다음과 같은 정보를 수집할 수 있습니다.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>이용자가 입력한 메시지 초안, 상황 설명, 관계 정보</li>
          <li>서비스 이용 기록(생성 시각, 선택한 결과, 피드백, 반응 기록 등)</li>
          <li>접속 로그, 기기/브라우저 정보, 쿠키 또는 유사 기술을 통해 수집되는 정보</li>
          <li>유료 결제 이용 시 결제 상태 확인에 필요한 주문 정보</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. 정보 이용 목적</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>메시지 생성 및 개인화된 결과 제공</li>
          <li>서비스 품질 개선 및 기능 실험</li>
          <li>오류 대응, 보안, 악용 방지</li>
          <li>이용 통계 분석 및 운영 개선</li>
          <li>유료 서비스 제공, 결제 확인, 고객 문의 대응</li>
          <li>광고 제공 및 광고 성과 측정</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. 광고 및 쿠키 사용 안내</h2>
        <p>
          서비스는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있습니다.
          제3자 벤더(예: Google)는 쿠키를 사용하여 이용자의 이전 방문 정보에 기반한 광고를 제공할 수 있습니다.
        </p>
        <p>
          Google의 광고 쿠키 사용을 통해 Google 및 Google의 파트너는 이용자의 본 서비스 또는 다른 웹사이트 방문 이력을 바탕으로 광고를 제공할 수 있습니다.
        </p>
        <p>
          이용자는 브라우저 설정 또는 관련 광고 설정 페이지를 통해 쿠키 사용을 제한하거나 맞춤형 광고를 관리할 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. 제3자 제공 및 처리위탁</h2>
        <p>
          서비스 운영을 위해 아래와 같은 외부 서비스를 사용할 수 있습니다.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>AI API 제공사: 메시지 생성 기능 제공</li>
          <li>데이터 저장/분석 서비스: 서비스 운영 및 품질 개선</li>
          <li>결제 서비스 제공사: 유료 결제 처리</li>
          <li>광고 서비스 제공사: 광고 제공 및 성과 측정</li>
        </ul>
        <p>
          서비스는 이용자 동의 또는 법령상 근거가 있는 경우를 제외하고 개인정보를 무단으로 제3자에게 판매하지 않습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. 보관 기간</h2>
        <p>
          서비스는 수집 목적 달성 시까지 정보를 보관하며, 관련 법령상 보존 의무가 있는 경우 해당 기간 동안 보관할 수 있습니다.
        </p>
        <p>
          다만, 서비스 개선 및 실험 분석을 위해 입력 데이터가 익명화 또는 비식별화된 형태로 보관될 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. 이용자 권리</h2>
        <p>
          이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.
          관련 요청은 아래 문의처로 접수할 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">7. 유료 서비스 관련 정보</h2>
        <p>
          유료 상품 결제 시 실제 카드 정보와 같은 민감한 결제 정보는 결제대행사(PG사)가 처리할 수 있으며,
          서비스는 결제 상태 확인 및 주문 관리에 필요한 최소한의 정보만 확인할 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">8. 문의처</h2>
        <p>이메일: rrt784512@snu.ac.kr</p>
        <p>운영자/상호: AI Buffer</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">9. 시행일</h2>
        <p>본 방침은 2026년 3월 25일부터 적용됩니다.</p>
      </section>
    </main>
  );
}