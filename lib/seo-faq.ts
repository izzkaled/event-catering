export type FaqItem = {
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
}

/** FAQs for Event Catering intermediary model — used for UI + FAQPage schema. */
export const SEO_FAQS: FaqItem[] = [
  {
    questionAr: 'كيف تعمل خدمة إيفنت كاترينج؟',
    questionEn: 'How does Event Catering work?',
    answerAr:
      'تختار الباقة المناسبة وعدد الحضور وتاريخ المناسبة، نراجع طلبك وننسّق مع مزوّدي الضيافة، ثم نرد عليك بالموافقة أو عرض السعر النهائي خلال وقت قصير.',
    answerEn:
      'You choose a package, guest count, and event date. We review your request, coordinate with hospitality partners, then reply with approval or a final quote shortly.',
  },
  {
    questionAr: 'هل الأسعار المعروضة نهائية؟',
    questionEn: 'Are the listed prices final?',
    answerAr:
      'الأسعار استرشادية حسب الباقة وعدد الأشخاص. السعر النهائي يُؤكَّد بعد مراجعة الموقع والتاريخ والمتطلبات الخاصة بجهتكم.',
    answerEn:
      'Listed prices are indicative by package and guest count. The final price is confirmed after reviewing venue, date, and your organization’s specific requirements.',
  },
  {
    questionAr: 'لمن الخدمة موجهة؟',
    questionEn: 'Who is the service for?',
    answerAr:
      'للجهات الحكومية والشركات والمؤسسات التي تحتاج ضيافة جاهزة بالمناسبات والاجتماعات والافتتاحات — بنظام باقات واضح.',
    answerEn:
      'Government entities, companies, and organizations that need ready hospitality for events, meetings, and openings — via clear packages.',
  },
  {
    questionAr: 'هل أحتاج حساب لإرسال طلب؟',
    questionEn: 'Do I need an account to submit a request?',
    answerAr:
      'يمكنك بدء الطلب بسهولة. لتأكيد الطلب ومتابعته يُفضّل تسجيل الدخول عبر البريد أو الجوال.',
    answerEn:
      'You can start a request easily. To confirm and track it, signing in with email or phone is recommended.',
  },
  {
    questionAr: 'ماذا يحدث بعد إرسال الطلب؟',
    questionEn: 'What happens after I submit a request?',
    answerAr:
      'يصلك إشعار تأكيد، ويستلم فريقنا الطلب فوراً. ننسّق خلف الكواليس ثم نعود إليكم بالموافقة أو العرض النهائي.',
    answerEn:
      'You get a confirmation notice and our team receives the request immediately. We coordinate behind the scenes, then return with approval or a final offer.',
  },
  {
    questionAr: 'هل يمكن طلب ضيافة مخصصة خارج الباقات؟',
    questionEn: 'Can I request custom hospitality outside packages?',
    answerAr:
      'نعم. اختر أقرب باقة أو أرسل طلباً مع ملاحظاتك، وسنجهّز عرضاً يناسب مناسبتكم.',
    answerEn:
      'Yes. Pick the closest package or send a request with your notes, and we will prepare an offer that fits your event.',
  },
]
