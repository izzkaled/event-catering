'use client'

import Link from 'next/link'
import { LegalDoc, type LegalSection } from '@/components/legal/legal-doc'

const PHONE = '+968 9702 1006'
const EMAIL = 'Izzkaled@gmail.com'

const sections: LegalSection[] = [
  {
    id: 'accept',
    titleAr: 'قبول الشروط',
    titleEn: 'Acceptance',
    bodyAr: (
      <>
        <p>
          باستخدامك موقع <strong>إيفنت كاترينج</strong> أو إنشاء حساب أو إرسال طلب ضيافة، فإنك توافق على هذه
          الشروط والأحكام وعلى <Link href="/privacy">سياسة الخصوصية</Link>. إذا لم توافق، يُرجى عدم استخدام
          المنصة.
        </p>
        <p>الخدمة مخصّصة لطلبات الضيافة والكاترينج في سلطنة عُمان (مع التركيز على مسقط والمناطق التي نغطيها).</p>
      </>
    ),
    bodyEn: (
      <>
        <p>
          By using <strong>Event Catering</strong>, creating an account, or submitting a hospitality request, you
          agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do
          not use the platform.
        </p>
        <p>
          The service is for hospitality and catering requests in the Sultanate of Oman (focused on Muscat and areas
          we cover).
        </p>
      </>
    ),
  },
  {
    id: 'service',
    titleAr: 'طبيعة الخدمة',
    titleEn: 'Nature of the service',
    bodyAr: (
      <>
        <ul>
          <li>المنصة تتيح تصفح الباقات وتخصيص الطلب وإرساله أونلاين.</li>
          <li>
            إرسال الطلب عبر الموقع يُعد <strong>طلبًا</strong> وليس تأكيد حجز نهائيًا إلا بعد تواصلنا أو تأكيدنا
            الصريح أو اكتمال الدفع حسب الاتفاق.
          </li>
          <li>الأسعار المعروضة بالريال العُماني وتشمل الضريبة ما لم يُذكر خلاف ذلك.</li>
          <li>التفاصيل النهائية (القائمة، التوقيت، الموقع، العدد) قد تُراجع معك قبل التنفيذ.</li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>The platform lets you browse packages, customise a request, and submit it online.</li>
          <li>
            Submitting a request is a <strong>request</strong>, not a final confirmed booking, until we expressly
            confirm or payment is completed as agreed.
          </li>
          <li>Displayed prices are in Omani Rial and include VAT unless stated otherwise.</li>
          <li>Final details (menu, timing, venue, guest count) may be reviewed with you before fulfilment.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'accounts',
    titleAr: 'الحسابات والاستخدام المقبول',
    titleEn: 'Accounts and acceptable use',
    bodyAr: (
      <>
        <ul>
          <li>أنت مسؤول عن دقة بياناتك وعن حماية رمز التحقق وبيانات الدخول.</li>
          <li>يُحظر إساءة استخدام المنصة، أو إرسال طلبات وهمية، أو محاولة اختراق أو تعطيل الخدمة.</li>
          <li>يحق لنا تعليق أو إنهاء الوصول عند مخالفة الشروط أو الاشتباه باحتيال.</li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>You are responsible for accurate details and for protecting verification codes and credentials.</li>
          <li>Abuse, fake requests, hacking attempts, or service disruption are prohibited.</li>
          <li>We may suspend or terminate access for breaches or suspected fraud.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'orders',
    titleAr: 'الطلبات والتعديلات والإلغاء',
    titleEn: 'Orders, changes, and cancellation',
    bodyAr: (
      <>
        <ul>
          <li>بعد إرسال الطلب سنتواصل للتأكيد أو طلب تفاصيل إضافية عند الحاجة.</li>
          <li>أي تعديل جوهري على العدد أو الموعد أو الموقع قد يغيّر السعر أو التوفر.</li>
          <li>
            سياسات الإلغاء والاسترداد تُحدَّد حسب طبيعة المناسبة وموعد الإشعار وشروط الدفع المتفق عليها لكل طلب.
            تواصل معنا مبكرًا عبر واتساب أو البريد لتسوية أي تغيير.
          </li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>After you submit a request we will follow up to confirm or ask for more details if needed.</li>
          <li>Material changes to guest count, date, or venue may affect price or availability.</li>
          <li>
            Cancellation and refund terms depend on the occasion, notice timing, and payment terms agreed for each
            request. Contact us early via WhatsApp or email to settle changes.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    titleAr: 'المدفوعات',
    titleEn: 'Payments',
    bodyAr: (
      <>
        <p>
          قد تتم المدفوعات عبر بوابات دفع إلكترونية أو بطرق أخرى نوضحها لك. معالجة بيانات البطاقة تتم عبر مزوّد
          الدفع وفق سياساته الأمنية. أي رسوم بنكية أو فشل دفع خارج سيطرتنا يُعالَج وفق سياسة المزوّد والبنك.
        </p>
      </>
    ),
    bodyEn: (
      <>
        <p>
          Payments may be taken through electronic gateways or other methods we share with you. Card data is handled
          by the payment provider under its security rules. Bank fees or payment failures outside our control follow
          the provider’s and bank’s policies.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    titleAr: 'المسؤولية والضمان',
    titleEn: 'Liability and disclaimer',
    bodyAr: (
      <>
        <ul>
          <li>نبذل جهدًا معقولًا لتقديم خدمة ضيافة مهنية، دون ضمان عدم وقوع تأخير بسبب ظروف خارجة عن الإرادة.</li>
          <li>
            في حدود ما يسمح به القانون، لا نتحمل مسؤولية غير مباشرة أو تبعية عن خسائر ناتجة عن استخدام الموقع أو
            اعتمادك على تقديرات أولية قبل التأكيد النهائي.
          </li>
          <li>الصور والمحتوى على الموقع لأغراض توضيحية وقد تختلف التفاصيل الفعلية حسب الاتفاق النهائي.</li>
        </ul>
      </>
    ),
    bodyEn: (
      <>
        <ul>
          <li>
            We take reasonable care to deliver professional hospitality, without guaranteeing no delay from events
            beyond our control.
          </li>
          <li>
            To the extent permitted by law, we are not liable for indirect or consequential losses from site use or
            reliance on preliminary estimates before final confirmation.
          </li>
          <li>Images and site content are illustrative; actual details may vary per final agreement.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip',
    titleAr: 'الملكية الفكرية',
    titleEn: 'Intellectual property',
    bodyAr: (
      <p>
        العلامة التجارية والشعارات والصور والنصوص وتصميم المنصة ملك لإيفنت كاترينج أو مرخّصة لها. لا يجوز نسخها أو
        إعادة استخدامها لأغراض تجارية دون إذن مكتوب مسبق.
      </p>
    ),
    bodyEn: (
      <p>
        The brand, logos, images, text, and platform design belong to Event Catering or its licensors. You may not
        copy or reuse them commercially without prior written permission.
      </p>
    ),
  },
  {
    id: 'law',
    titleAr: 'القانون والاختصاص',
    titleEn: 'Governing law',
    bodyAr: (
      <p>
        تخضع هذه الشروط لأنظمة سلطنة عُمان، ويكون الاختصاص للمحاكم العُمانية المختصة في مسقط ما لم يقتضِ النظام
        خلاف ذلك. كما نراعي متطلبات حماية البيانات الشخصية المعمول بها في عُمان.
      </p>
    ),
    bodyEn: (
      <p>
        These Terms are governed by the laws of the Sultanate of Oman. Disputes are subject to the competent Omani
        courts in Muscat unless law requires otherwise. We also observe applicable Omani personal data protection
        requirements.
      </p>
    ),
  },
  {
    id: 'changes',
    titleAr: 'تعديل الشروط',
    titleEn: 'Changes to these Terms',
    bodyAr: (
      <p>
        قد نحدّث الشروط من وقت لآخر. النسخة المنشورة على هذه الصفحة هي المعتمدة مع تاريخ سريانها. استمرار الاستخدام
        بعد التحديث يُعد قبولًا للنسخة الجديدة.
      </p>
    ),
    bodyEn: (
      <p>
        We may update these Terms from time to time. The version published on this page with its effective date
        controls. Continued use after an update constitutes acceptance of the new version.
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
          <li>مسقط، سلطنة عُمان</li>
        </ul>
        <p>
          راجع أيضًا <Link href="/privacy">سياسة الخصوصية</Link>.
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
          <li>Muscat, Sultanate of Oman</li>
        </ul>
        <p>
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
]

export function TermsContent() {
  return (
    <LegalDoc
      kickerAr="إيفنت كاترينج · عُمان"
      kickerEn="Event Catering · Oman"
      titleAr="الشروط والأحكام"
      titleEn="Terms of Service"
      introAr="تنظّم هذه الشروط استخدامك لمنصة إيفنت كاترينج وطلبات الضيافة عبر الموقع، بما في ذلك الحسابات والدفع والمسؤولية."
      introEn="These Terms govern your use of Event Catering and hospitality requests on the site, including accounts, payment, and liability."
      updatedAr="سريان النسخة: ٣ نوفمبر ٢٠٢٦"
      updatedEn="Effective: 3 November 2026"
      sections={sections}
      related={[
        { href: '/privacy', labelAr: 'سياسة الخصوصية', labelEn: 'Privacy Policy' },
        { href: '/faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
      ]}
    />
  )
}
