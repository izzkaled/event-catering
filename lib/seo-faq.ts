export type FaqItem = {
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
}

/** Long-tail FAQs people search in Muscat (AR + EN) — used for UI + FAQPage schema. */
export const SEO_FAQS: FaqItem[] = [
  {
    questionAr: 'كم سعر تنظيف المنازل في مسقط؟',
    questionEn: 'How much does home cleaning cost in Muscat?',
    answerAr:
      'أسعار خوصة تبدأ تقريباً من 40 ر.ع شهرياً حسب عدد الساعات والزيارات الأسبوعية. كل باقة بسعر شهري واضح بالريال العُماني بدون رسوم مخفية — اختر الباقة المناسبة واحجز أونلاين.',
    answerEn:
      'KHOUSA packages start from about 40 OMR per month, depending on hours and weekly visits. Every plan has clear monthly pricing in Omani Rial with no hidden fees — pick a package and book online.',
  },
  {
    questionAr: 'هل خوصة تغطي بوشر والسيب ومطرح؟',
    questionEn: 'Does KHOUSA cover Bawshar, Seeb, and Muttrah?',
    answerAr:
      'نعم. نخدم مسقط وضواحيها حالياً: مسقط القديمة، مطرح، بوشر، العامرات، السيب، وقريات. إذا منطقتك ضمن مسقط يمكنك الحجز مباشرة.',
    answerEn:
      'Yes. We currently serve Muscat and surroundings: Old Muscat, Muttrah, Bawshar, Al Amerat, Seeb, and Quriyat. If you are in Muscat, you can book right away.',
  },
  {
    questionAr: 'هل أحتاج حساب عشان أحجز تنظيف منزلي؟',
    questionEn: 'Do I need an account to book house cleaning?',
    answerAr:
      'تقدر تبدأ الحجز بسهولة. لتأكيد الطلب ومتابعة الاشتراك يُفضّل تسجيل الدخول عبر Google أو البريد أو رقم الجوال العُماني.',
    answerEn:
      'You can start booking easily. To confirm and manage your subscription, sign in with Google, email, or an Oman mobile number.',
  },
  {
    questionAr: 'ما الفرق بين باقة ساعتين وباقة 3 أو 4 ساعات؟',
    questionEn: 'What is the difference between 2-hour and 3–4 hour packages?',
    answerAr:
      'الباقات الأقصر تناسب الشقق والصيانة الأسبوعية الخفيفة. باقات 3–4 ساعات أنسب للمنازل الأكبر أو التنظيف الأعمق. اختر أيضاً عدد الزيارات الأسبوعية حسب احتياجك.',
    answerEn:
      'Shorter visits suit apartments and light weekly upkeep. 3–4 hour packages fit larger homes or deeper cleans. Also choose weekly visit frequency based on your needs.',
  },
  {
    questionAr: 'كيف أدفع اشتراك التنظيف؟',
    questionEn: 'How do I pay for a cleaning subscription?',
    answerAr:
      'عند إتمام الحجز يمكنك الدفع إلكترونياً (عند التفعيل) أو عبر التحويل البنكي. بعد التأكيد يتواصل فريق خوصة خلال 24 ساعة لترتيب الزيارة الأولى.',
    answerEn:
      'At checkout you can pay online (when enabled) or by bank transfer. After confirmation, the KHOUSA team contacts you within 24 hours to schedule the first visit.',
  },
  {
    questionAr: 'هل توفرون تنظيف مكاتب في مسقط؟',
    questionEn: 'Do you offer office cleaning in Muscat?',
    answerAr:
      'نعم، لدينا باقات مكتبية ضمن الخدمات. يمكنك اختيارها من صفحة الحجز أو السؤال عبر مساعد خوصة أو واتساب.',
    answerEn:
      'Yes — we offer office cleaning packages. Choose one on the booking page, or ask via the KHOUSA chat assistant or WhatsApp.',
  },
]
