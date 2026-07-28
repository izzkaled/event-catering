import { SEO_FAQS } from '@/lib/seo-faq'
import { SITE_URL } from '@/lib/seo'

export function JsonLdFaq() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SEO_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.questionAr,
      alternateName: item.questionEn,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${item.answerAr} ${item.answerEn}`,
      },
    })),
    url: `${SITE_URL}/faq`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
