'use client'

import Link from 'next/link'
import { LegalDoc, type LegalSection } from '@/components/legal/legal-doc'

const PHONE = '+968 9702 1006'
const EMAIL = 'Izzkaled@gmail.com'

const sections: LegalSection[] = [
  {
    id: 'who',
    titleAr: 'من نحن',
    titleEn: 'Who we are',
    bodyAr: (
      <>
        <p>
          تُدار منصة <strong>إيفنت كاترينج (Event Catering)</strong> من مسقط، سلطنة عُمان،
          لتقديم باقات الضيافة والكاترينج وطلبات المناسبات عبر الموقع{' '}
          <a href="https://www.event-om.com">www.event-om.com</a>.
        </p>
        <p>
          نحن ملتزمون بحماية بياناتك الشخصية وفق الممارسات المعقولة وبما يتوافق مع{' '}
          <strong>قانون حماية البيانات الشخصية</strong> في سلطنة عُمان (المرسوم السلطاني رقم ٦ / ٢٠٢٢)
          والأنظمة ذات الصلة.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>
          <strong>Event Catering (إيفنت كاترينج)</strong> is operated from Muscat, Sultanate of Oman,
          to provide hospitality packages and event catering requests via{' '}
          <a href="https://www.event-om.com">www.event-om.com</a>.
        </p>
        <p>
          We protect personal data using reasonable safeguards and in line with Oman’s{' '}
          <strong>Personal Data Protection Law</strong> (Royal Decree 6/2022) and related regulations.
        </p>
      </>
    ),
  },
  {
    id: 'data',
    titleAr: 'ما البيانات التي نجمعها',
    titleEn: 'What data we collect',
    bodyAr: (
      <>
        <p>حسب استخدامك للمنصة قد نجمع:</p>
        <ul>
          <li>
            <strong>بيانات الحساب:</strong> الاسم، رقم الجوال العُماني، البريد الإلكتروني، المنطقة،
            والعنوان.
          </li>
          <li>
            <strong>بيانات الطلب:</strong> تفاصيل المناسبة، عدد الضيوف، الباقة المختارة، الموعد،
            والخدمات الإضافية، والملاحظات.
          </li>
          <li>
            <strong>بيانات الدفع:</strong> حالة الدفع والمرجع من مزوّد الدفع. لا نخزّن أرقام البطاقات
            كاملة على خوادمنا.
          </li>
          <li>
            <strong>بيانات تقنية محدودة:</strong> معرّف زائر مجهول في المتصفح، الصفحة التي تمت زيارتها،
            ونوع الجهاز/المتصفح بالقدر اللازم لتشغيل الموقع ومنع الإساءة.
          </li>
          <li>
            <strong>التواصل:</strong> الرسائل التي ترسلها عبر النماذج أو واتساب أو البريد.
          </li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <p>Depending on how you use the platform, we may collect:</p>
        <ul>
          <li>
            <strong>Account data:</strong> name, Omani mobile number, email, area, and address.
          </li>
          <li>
            <strong>Order data:</strong> occasion details, guest count, selected package, schedule,
            add-ons, and notes.
          </li>
          <li>
            <strong>Payment data:</strong> payment status and references from the payment provider.
            We do not store full card numbers on our servers.
          </li>
          <li>
            <strong>Limited technical data:</strong> an anonymous browser visitor ID, visited page,
            and device/browser signals needed to run the site and prevent abuse.
          </li>
          <li>
            <strong>Communications:</strong> messages you send via forms, WhatsApp, or email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'why',
    titleAr: 'لماذا نستخدم بياناتك',
    titleEn: 'Why we use your data',
    bodyAr: (
      <>
        <ul>
          <li>إنشاء حسابك والتحقق منه (OTP للجوال أو تسجيل الدخول بالبريد/Google).</li>
          <li>استقبال طلبات الضيافة وتنفيذها ومتابعتها.</li>
          <li>إرسال التأكيدات والفواتير والتحديثات المتعلقة بطلبك.</li>
          <li>تحسين تجربة الموقع ومنع الاحتيال والاستخدام غير المشروع.</li>
          <li>الرد على استفساراتك ودعم العملاء.</li>
          <li>الامتثال للمتطلبات النظامية والمحاسبية عند الحاجة.</li>
        </ul>
        <p>لا نبيع بياناتك الشخصية لأطراف ثالثة لأغراض تسويق غير مرتبطة بخدمتنا.</p>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>Create and verify your account (phone OTP or email/Google sign-in).</li>
          <li>Receive, fulfil, and follow up on hospitality requests.</li>
          <li>Send confirmations, invoices, and order updates.</li>
          <li>Improve the site experience and prevent fraud or abuse.</li>
          <li>Respond to enquiries and provide customer support.</li>
          <li>Meet legal and accounting obligations when required.</li>
        </ul>
        <p>We do not sell your personal data to third parties for unrelated marketing.</p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    titleAr: 'الأساس النظامي للمعالجة',
    titleEn: 'Legal basis for processing',
    bodyAr: (
      <>
        <p>نعالج البيانات الشخصية عند توفر أساس مشروع، مثل:</p>
        <ul>
          <li>
            <strong>موافقتك</strong> عند إنشاء الحساب أو إرسال طلب أو التواصل معنا.
          </li>
          <li>
            <strong>تنفيذ عقد أو طلب خدمة</strong> (تجهيز الضيافة والدفع والمتابعة).
          </li>
          <li>
            <strong>مصلحة مشروعة</strong> لتشغيل المنصة بأمان وتحسينها، بما لا يخل بحقوقك.
          </li>
          <li>
            <strong>التزام نظامي</strong> عند طلب جهة مختصة أو متطلبات حفظ السجلات.
          </li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <p>We process personal data where a lawful basis applies, including:</p>
        <ul>
          <li>
            <strong>Your consent</strong> when you create an account, submit a request, or contact us.
          </li>
          <li>
            <strong>Contract / service fulfilment</strong> for hospitality delivery, payment, and follow-up.
          </li>
          <li>
            <strong>Legitimate interests</strong> to operate and secure the platform, without overriding your rights.
          </li>
          <li>
            <strong>Legal obligation</strong> when required by competent authorities or record-keeping rules.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    titleAr: 'مع من نشارك البيانات',
    titleEn: 'Who we share data with',
    bodyAr: (
      <>
        <p>قد نشارك الحد الأدنى اللازم من البيانات مع:</p>
        <ul>
          <li>مزوّدي الاستضافة وقواعد البيانات والتحقق (مثل بنية السحابة والمصادقة).</li>
          <li>مزوّدي الدفع لمعالجة المدفوعات بأمان.</li>
          <li>قنوات التواصل (مثل واتساب أو البريد) عندما تتواصل معنا عبرها.</li>
          <li>مزوّدي التحليلات التشغيلية الداخلية لفهم استخدام الموقع بشكل مجمّع قدر الإمكان.</li>
          <li>جهات رسمية عند وجود إلزام نظامي صحيح.</li>
        </ul>
        <p>نطلب من مزوّدينا حماية مناسبة للبيانات وعدم استخدامها خارج غرض الخدمة.</p>
      </>
    ),
    bodyEn: (
      <>
        <p>We may share the minimum necessary data with:</p>
        <ul>
          <li>Hosting, database, and authentication providers (cloud infrastructure and sign-in).</li>
          <li>Payment providers to process payments securely.</li>
          <li>Messaging channels (such as WhatsApp or email) when you contact us through them.</li>
          <li>Internal operational analytics tools, preferably in aggregated form.</li>
          <li>Competent authorities when legally required.</li>
        </ul>
        <p>We expect providers to apply appropriate safeguards and use data only for the service purpose.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    titleAr: 'ملفات الارتباط والتخزين المحلي',
    titleEn: 'Cookies and local storage',
    bodyAr: (
      <>
        <p>نستخدم تقنيات ضرورية لتشغيل الموقع، ومنها:</p>
        <ul>
          <li>
            <strong>جلسة تسجيل الدخول:</strong> ملفات ارتباط آمنة لإبقاء حسابك مسجّلًا.
          </li>
          <li>
            <strong>تفضيلات الواجهة:</strong> مثل اللغة أو اختيارات الباقات المؤقتة في المتصفح.
          </li>
          <li>
            <strong>إحصاء زيارات بسيط:</strong> معرّف زائر في التخزين المحلي لتمييز الزيارات دون معرفة هويتك الشخصية.
          </li>
        </ul>
        <p>
          يمكنك حذف ملفات الارتباط أو التخزين المحلي من إعدادات متصفحك، مع العلم أن بعض وظائف الحساب قد تتوقف.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>We use technologies needed to run the site, including:</p>
        <ul>
          <li>
            <strong>Sign-in session:</strong> secure cookies to keep your account authenticated.
          </li>
          <li>
            <strong>Interface preferences:</strong> such as language or temporary package choices in the browser.
          </li>
          <li>
            <strong>Simple visit analytics:</strong> a visitor ID in local storage to distinguish visits without
            identifying you personally.
          </li>
        </ul>
        <p>
          You can clear cookies or local storage in your browser settings; some account features may stop working.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    titleAr: 'مدة الاحتفاظ',
    titleEn: 'Retention',
    bodyAr: (
      <>
        <p>
          نحتفظ بالبيانات طالما كان حسابك نشطًا أو طالما لزم الأمر لتنفيذ الطلبات، والمحاسبة، وتسوية المدفوعات،
          والامتثال النظامي، أو حل النزاعات. بعدها نحذفها أو نجعلها غير قابلة للتعريف متى ما كان ذلك عمليًا.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>
          We keep data while your account is active or as needed to fulfil orders, accounting, payment settlement,
          legal compliance, or dispute resolution. After that we delete or de-identify it when practical.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    titleAr: 'الأمان',
    titleEn: 'Security',
    bodyAr: (
      <>
        <p>
          نطبّق تدابير تقنية وتنظيمية معقولة مثل تشفير الاتصال (HTTPS)، والتحقق متعدد القنوات عند الدخول،
          وتقييد صلاحيات الوصول الإدارية. لا توجد وسيلة نقل أو تخزين آمنة بنسبة ١٠٠٪، لذا نشجّعك على حماية
          جهازك ورمز التحقق وعدم مشاركة بيانات الدخول.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>
          We apply reasonable technical and organisational measures such as HTTPS, multi-channel sign-in checks,
          and limited admin access. No transmission or storage method is 100% secure, so please protect your device
          and verification codes and do not share login credentials.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    titleAr: 'حقوقك',
    titleEn: 'Your rights',
    bodyAr: (
      <>
        <p>وفق القانون المعمول به في عُمان، قد يحق لك طلب:</p>
        <ul>
          <li>الاطلاع على بياناتك الشخصية أو تصحيحها.</li>
          <li>تحديث ملفك من صفحة الحساب حيثما توفّر ذلك.</li>
          <li>طلب حذف أو تقييد معالجة بيانات غير لازمة، مع مراعاة الالتزامات النظامية.</li>
          <li>سحب الموافقة متى كانت المعالجة مبنية عليها، دون أثر رجعي على ما تم سابقًا بشكل مشروع.</li>
          <li>تقديم شكوى للجهة المختصة بحماية البيانات في سلطنة عُمان عند الاقتضاء.</li>
        </ul>
        <p>
          لتقديم طلب متعلق بالخصوصية راسلنا على{' '}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a> أو واتساب{' '}
          <a href={`https://wa.me/96897021006`} dir="ltr">
            {PHONE}
          </a>
          .
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>Under applicable Omani law, you may request to:</p>
        <ul>
          <li>Access or correct your personal data.</li>
          <li>Update your profile from the account page where available.</li>
          <li>Request deletion or restriction of unnecessary processing, subject to legal duties.</li>
          <li>Withdraw consent where processing relies on it, without affecting prior lawful processing.</li>
          <li>Lodge a complaint with Oman’s competent data protection authority when appropriate.</li>
        </ul>
        <p>
          For privacy requests, contact{' '}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or WhatsApp{' '}
          <a href={`https://wa.me/96897021006`} dir="ltr">
            {PHONE}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'children',
    titleAr: 'الأطفال',
    titleEn: 'Children',
    bodyAr: (
      <p>
        خدماتنا موجّهة لجهات وأفراد بالغين يخططون لمناسبات. لا نجمع عن قصد بيانات أطفال دون السن النظامي
        المناسب دون موافقة الولي عند الحاجة. إذا علمت بجمع غير مقصود، تواصل معنا لحذفها.
      </p>
    ),
    bodyEn: (
      <p>
        Our services are intended for adults and organisations planning events. We do not knowingly collect
        children’s data below the applicable age without guardian consent when required. If you become aware of
        unintended collection, contact us for deletion.
      </p>
    ),
  },
  {
    id: 'changes',
    titleAr: 'تحديث السياسة',
    titleEn: 'Policy updates',
    bodyAr: (
      <p>
        قد نحدّث هذه السياسة عند تغيّر خدماتنا أو المتطلبات النظامية. ننشر النسخة المحدّثة على هذه الصفحة مع
        تاريخ السريان. استمرار استخدامك للمنصة بعد التحديث يعني اطّلاعك على النسخة الجديدة.
      </p>
    ),
    bodyEn: (
      <p>
        We may update this policy when our services or legal requirements change. Updated versions are posted on
        this page with an effective date. Continued use of the platform after an update means you have reviewed the
        new version.
      </p>
    ),
  },
  {
    id: 'contact',
    titleAr: 'التواصل',
    titleEn: 'Contact',
    bodyAr: (
      <>
        <ul>
          <li>
            البريد: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </li>
          <li>
            الجوال / واتساب:{' '}
            <a href={`https://wa.me/96897021006`} dir="ltr">
              {PHONE}
            </a>
          </li>
          <li>الموقع: مسقط، سلطنة عُمان</li>
        </ul>
        <p>
          للاطلاع أيضًا على{' '}
          <Link href="/terms">الشروط والأحكام</Link>.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>
            Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </li>
          <li>
            Phone / WhatsApp:{' '}
            <a href={`https://wa.me/96897021006`} dir="ltr">
              {PHONE}
            </a>
          </li>
          <li>Location: Muscat, Sultanate of Oman</li>
        </ul>
        <p>
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </>
    ),
  },
]

export function PrivacyContent() {
  return (
    <LegalDoc
      kickerAr="إيفنت كاترينج · عُمان"
      kickerEn="Event Catering · Oman"
      titleAr="سياسة الخصوصية"
      titleEn="Privacy Policy"
      introAr="توضح هذه السياسة كيف نجمع بياناتك الشخصية ونستخدمها ونحميها عند استخدام منصة إيفنت كاترينج لطلبات الضيافة في عُمان."
      introEn="This policy explains how we collect, use, and protect your personal data when you use Event Catering for hospitality requests in Oman."
      updatedAr="سريان النسخة: ٣ نوفمبر ٢٠٢٦"
      updatedEn="Effective: 3 November 2026"
      sections={sections}
      related={[
        { href: '/terms', labelAr: 'الشروط والأحكام', labelEn: 'Terms of Service' },
        { href: '/faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
      ]}
    />
  )
}
